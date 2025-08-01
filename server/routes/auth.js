const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const authController = require("../controller/auth"); 
const {
  loginCheck,
  isAuth,
  isAdmin,
} = require("../middleware/auth");

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
router.post("/signin", authController.postSignin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);

router.post("/change-password", loginCheck, isAuth, authController.changePassword);
router.post("/isadmin", loginCheck, isAuth, authController.isAdmin);
router.post("/user", loginCheck, isAuth, isAdmin, authController.allUser);
router.post("/logout", authController.logout);

module.exports = router;
