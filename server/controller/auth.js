const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const { logToFile } = require("../utils/logger");
const sendEmail = require("../utils/sendMail");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;
const SESSION_EXPIRES_IN_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_HISTORY_LIMIT = 5;
const PASSWORD_EXPIRES_IN_DAYS = 90;  // Password expires after 90 days

class Auth {
  async postSignup(req, res) {
    let { name, email, password, cPassword, userRole } = req.body;

    if (!name || !email || !password || !cPassword) {
      return res.json({ error: "All fields are required" });
    }

    if (name.length < 3 || name.length > 25) {
      return res.json({ error: "Name must be 3-25 characters" });
    }

    if (!validateEmail(email)) {
      return res.json({ error: "Email is invalid" });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.json({
        error: "Password must be at least 8 characters and include a number and uppercase letter",
      });
    }

    try {
      const existing = await userModel.findOne({ email });
      if (existing) return res.json({ error: "Email already exists" });

      const hashed = bcrypt.hashSync(password, 10);
      const newUser = new userModel({
        name: toTitleCase(name),
        email,
        password: hashed,
        userRole: userRole || 0,
        oldPasswords: [hashed],
        passwordLastChanged: Date.now(),  
      });

      await newUser.save();
      logToFile(`User registered: ${email}, ID: ${newUser._id}`);

      return res.json({ success: "Account created successfully. Please login." });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async postSignin(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ error: "Fields must not be empty" });

    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        logToFile(`Failed login (no user found): ${email}`);
        return res.json({ error: "Invalid email or password" });
      }

      if (user.lockUntil && user.lockUntil > Date.now()) {
        return res.json({ error: "Account is locked. Try again later." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = Date.now() + LOCK_TIME_MINUTES * 60 * 1000;
          logToFile(`User locked out: ${email}, ID: ${user._id}`);
        } else {
          logToFile(`Failed login attempt for: ${email}`);
        }

        await user.save();
        return res.json({ error: "Invalid email or password" });
      }

      // Check password expiry
      const passwordAge = (Date.now() - new Date(user.passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24);
      if (passwordAge >= PASSWORD_EXPIRES_IN_DAYS) {
        return res.json({ error: "Password expired. Please reset your password.", expired: true });
      }

      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      // Save user session with 24 hour expiry
      req.session.user = {
        _id: user._id,
        email: user.email,
        role: user.userRole,
      };

      // Set session cookie max age to 24 hours
      req.session.cookie.maxAge = SESSION_EXPIRES_IN_MS;

      logToFile(`User logged in (session): ${email}, ID: ${user._id}`);

      return res.json({
        success: "Logged in successfully",
        user: {
          _id: user._id,
          email: user.email,
          role: user.userRole,
        },
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: "Logged out successfully" });
    });
  }

  async verifyOtp(req, res) {
    const { email, otp } = req.body;
    const user = await userModel.findOne({ email });

    if (!user || user.otpCode !== otp || Date.now() > user.otpExpires) {
      return res.json({ error: "Invalid or expired OTP" });
    }

    return res.json({ success: "OTP verified" });
  }

  async forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) return res.json({ error: "Email is required" });

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ error: "User not found" });

    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    user.otpCode = otp;
    user.otpExpires = expiry;
    await user.save();

    try {
      await sendEmail(
        user.email,
        "Your OTP Code (Valid for 10 mins)",
        `Your OTP code is: ${otp}`
      );
      res.json({ success: "OTP sent to email" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send email" });
    }
  }

  async resetPassword(req, res) {
    const { email, otp, newPassword } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ error: "User not found" });

    if (user.otpCode !== otp || Date.now() > user.otpExpires) {
      return res.json({ error: "Invalid or expired OTP" });
    }

    const reused = await Promise.all(
      user.oldPasswords.map(old => bcrypt.compare(newPassword, old))
    );

    if (reused.includes(true)) {
      return res.json({ error: "Cannot reuse an old password" });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    user.password = hashed;
    user.oldPasswords.unshift(hashed);
    user.oldPasswords = user.oldPasswords.slice(0, PASSWORD_HISTORY_LIMIT);
    user.otpCode = null;
    user.otpExpires = null;
    user.passwordLastChanged = Date.now();  // Update password change date on reset

    await user.save();
    return res.json({ success: "Password has been reset" });
  }

  async changePassword(req, res) {
    const { uId, oldPassword, newPassword } = req.body;
    if (!uId || !oldPassword || !newPassword) {
      return res.json({ error: "All fields are required" });
    }

    const user = await userModel.findById(uId);
    if (!user) return res.json({ error: "User not found" });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.json({ error: "Old password is incorrect" });

    for (let old of user.oldPasswords) {
      if (await bcrypt.compare(newPassword, old)) {
        return res.json({ error: "You cannot reuse an old password" });
      }
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    user.password = hashed;
    user.passwordLastChanged = Date.now(); 
    user.oldPasswords.unshift(hashed);
    user.oldPasswords = user.oldPasswords.slice(0, PASSWORD_HISTORY_LIMIT);
    await user.save();

    return res.json({ success: "Password updated successfully" });
  }

  async isAdmin(req, res) {
    let { loggedInUserId } = req.body;
    try {
      let loggedInUser = await userModel.findById(loggedInUserId);
      res.json({ role: loggedInUser.userRole });
    } catch {
      res.status(404).json({ error: "User not found" });
    }
  }

  async allUser(req, res) {
    try {
      let allUser = await userModel.find({});
      res.json({ users: allUser });
    } catch {
      res.status(404).json({ error: "Could not fetch users" });
    }
  }
}

module.exports = new Auth();
