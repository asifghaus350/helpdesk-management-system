const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET ALL USERS
// =========================

router.get(
  "/",
  authMiddleware,
  getUsers
);

// =========================
// GET SINGLE USER
// =========================

router.get(
  "/:id",
  authMiddleware,
  getUserById
);

// =========================
// CREATE USER
// =========================

router.post(
  "/",
  authMiddleware,
  createUser
);

// =========================
// UPDATE USER
// =========================

router.put(
  "/:id",
  authMiddleware,
  updateUser
);

// =========================
// DELETE USER
// =========================

router.delete(
  "/:id",
  authMiddleware,
  deleteUser
);

module.exports = router;