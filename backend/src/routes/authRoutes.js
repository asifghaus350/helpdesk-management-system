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
  validateBody,
  validateObjectId,
  rules,
  required,
} = require("../middleware/validate");
const {
  authLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiter");

const {
  googleLogin,
} = require("../controllers/googleAuthController");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validateBody({
    name: required(rules.name),
    email: required(rules.email),
    password: required(rules.password),
  }),
  registerUser
);

router.post(
  "/login",
  authLimiter,
  validateBody({
    email: required({ label: "Email", type: "string", max: 254 }),
    password: required({ label: "Password", type: "string", max: 128 }),
  }),
  loginUser
);

router.get("/me", authMiddleware, getMe);

router.put(
  "/change-password",
  authMiddleware,
  validateBody({
    currentPassword: required({ label: "Current password", type: "string", max: 128 }),
    newPassword: required({ ...rules.password, label: "New password" }),
    confirmPassword: required({ label: "Confirm password", type: "string", max: 128 }),
  }),
  changePassword
);

router.post("/google", authLimiter, googleLogin);

// Forgot Password
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateBody({ email: required(rules.email) }),
  forgotPassword
);

// Reset Password
router.post(
  "/reset-password/:token",
  passwordResetLimiter,
  validateBody({
    newPassword: required({ ...rules.password, label: "New password" }),
    confirmPassword: required({ label: "Confirm password", type: "string", max: 128 }),
  }),
  resetPassword
);

module.exports = router;