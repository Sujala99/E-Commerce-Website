const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");

const authController = require("../controller/auth"); 
const {
  loginCheck,
  isAuth,
  isAdmin,
} = require("../middleware/auth");

// Rate limiter for signin route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/signup",
  [
    body("name").trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
    }),
  ],
  authController.postSignup
);

router.post("/signin", loginLimiter, authController.postSignin);

router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);

router.post("/change-password", loginCheck, isAuth, authController.changePassword);
router.post("/isadmin", loginCheck, isAuth, authController.isAdmin);
router.post("/user", loginCheck, isAuth, isAdmin, authController.allUser);
router.post("/logout", authController.logout);

module.exports = router;
