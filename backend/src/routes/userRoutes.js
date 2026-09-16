const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateOwnProfile,
  updateProfilePhoto,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================
// GET ALL USERS
// ADMIN ONLY
// =========================

router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin"),
  getUsers
);

// =========================
// GET SINGLE USER
// ADMIN ONLY
// =========================

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("Admin"),
  getUserById
);

// =========================
// CREATE USER
// ADMIN ONLY
// =========================

router.post(
  "/",
  authMiddleware,
  authorizeRoles("Admin"),
  createUser
);

// =========================
// UPDATE OWN PROFILE
// ALL AUTHENTICATED USERS
// =========================

router.put(
  "/profile",
  authMiddleware,
  updateOwnProfile
);

// =========================
// UPDATE OWN PROFILE PHOTO
// ALL AUTHENTICATED USERS
// =========================

router.put(
  "/profile/photo",
  authMiddleware,
  updateProfilePhoto
);

// =========================
// UPDATE USER
// ADMIN ONLY
// =========================

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("Admin"),
  updateUser
);

// =========================
// DELETE USER
// ADMIN ONLY
// =========================

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("Admin"),
  deleteUser
);

module.exports = router;