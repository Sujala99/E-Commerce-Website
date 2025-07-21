const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const nodemailer = require("nodemailer");
const zxcvbn = require("zxcvbn");
const speakeasy = require("speakeasy");

const userEmail = process.env.USER_EMAIL;
const userEmailPass = process.env.USER_EMAIL_PASS;
const jwtTokenSecret = process.env.JWT_TOKEN_SECRET;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: userEmail, pass: userEmailPass },
});

exports.signUp = async (req, res, next) => {
  try {
    if (!req.file) throw new Error("No file found.");
    const { username, email, password, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("Email already exists.");

    const strength = zxcvbn(password);
    if (strength.score < 3) throw new Error("Password too weak.");

    const hashedPass = await bcrypt.hash(password, 12);

    const secret = speakeasy.generateSecret();

    const newUser = new User({
      username,
      email,
      status,
      password: hashedPass,
      profileImage: path.basename(req.file.filename),
      previousPasswords: [hashedPass],
      twoFactorSecret: secret.base32,
    });

    const savedUser = await newUser.save();
    const verifyToken = jwt.sign({ userId: savedUser._id }, jwtTokenSecret, { expiresIn: "1d" });
    const link = `http://localhost:3000/verify-email?token=${verifyToken}`;

    await transporter.sendMail({
      to: savedUser.email,
      subject: "Verify your email",
      html: `Click <a href="${link}">here</a> to verify your account.`,
    });

    res.status(201).json({ message: "Signup successful, please verify email." });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, jwtTokenSecret);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error("User not found.");
    user.isVerified = true;
    await user.save();
    res.status(200).json({ message: "Email verified successfully." });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found.");

    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new Error("Account is temporarily locked.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }
      await user.save();
      throw new Error("Incorrect password.");
    }

    if (user.twoFactorEnabled) {
      const isValidOTP = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: otp,
      });
      if (!isValidOTP) throw new Error("Invalid OTP.");
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign(
      { email: user.email, userId: user._id.toString(), status: user.status },
      jwtTokenSecret,
      { expiresIn: "30m" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    next(err);
  }
};

exports.initiateResetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found.");

    const resetToken = jwt.sign({ userId: user._id }, jwtTokenSecret, { expiresIn: "5m" });
    const link = `http://localhost:3000/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      to: email,
      subject: "Reset Password",
      html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`,
    });

    res.status(200).json({ message: "Reset email sent." });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) throw new Error("User not found.");

    const isReused = await Promise.any(
      user.previousPasswords.map(p => bcrypt.compare(newPassword, p))
    ).catch(() => false);

    if (isReused) throw new Error("Cannot reuse old password.");

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.previousPasswords.unshift(hashedPassword);
    user.previousPasswords = user.previousPasswords.slice(0, 5);
    await user.save();

    res.status(200).json({ message: "Password changed." });
  } catch (err) {
    next(err);
  }
};
