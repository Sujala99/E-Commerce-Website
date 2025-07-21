const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const isAuth = require("../middlewares/is_auth");
const fileUploader = require("../middlewares/file_upload");

router.post("/signup", fileUploader.single("profileImage"), authController.signUp);
router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/initiate-reset-password", authController.initiateResetPassword);
router.put("/reset-password", isAuth, authController.resetPassword);

module.exports = router;
