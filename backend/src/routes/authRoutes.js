const express = require("express");

const {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const {
  authLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiter");

const {
  googleLogin,
} = require("../controllers/googleAuthController");

const router = express.Router();

router.post("/register", authLimiter, registerUser);

router.post("/login", authLimiter, loginUser);

router.get("/me", authMiddleware, getMe);

router.put("/change-password", authMiddleware, changePassword);

router.post("/google", authLimiter, googleLogin);

// Forgot Password
router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPassword
);

// Reset Password
router.post(
  "/reset-password/:token",
  passwordResetLimiter,
  resetPassword
);

module.exports = router;