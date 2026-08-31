const express = require("express");

const {
  registerUser,
  loginUser,
  getMe,
  changePassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// REGISTER
// =========================

router.post(
  "/register",
  registerUser
);

// =========================
// LOGIN
// =========================

router.post(
  "/login",
  loginUser
);

// =========================
// CURRENT USER
// =========================

router.get(
  "/me",
  authMiddleware,
  getMe
);

// =========================
// CHANGE PASSWORD
// =========================

router.put(
  "/change-password",
  authMiddleware,
  changePassword
);

module.exports = router;