const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateOwnProfile,
  updateProfilePhoto,
  updatePreferences,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  validateBody,
  validateObjectId,
  rules,
  required,
} = require("../middleware/validate");

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
  validateObjectId(),
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
  validateBody({
    name: required(rules.name),
    email: required(rules.email),
    password: required(rules.password),
    role: rules.role,
    status: rules.userStatus,
    phone: rules.phone,
    department: rules.department,
  }),
  createUser
);

// =========================
// UPDATE OWN PROFILE
// ALL AUTHENTICATED USERS
// =========================

router.put(
  "/profile",
  authMiddleware,
  validateBody({
    name: rules.name,
    email: rules.email,
    phone: rules.phone,
  }),
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
// UPDATE OWN PREFERENCES
// ALL AUTHENTICATED USERS
// =========================

router.put(
  "/profile/preferences",
  authMiddleware,
  updatePreferences
);

// =========================
// UPDATE USER
// ADMIN ONLY
// =========================

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("Admin"),
  validateObjectId(),
  validateBody({
    name: rules.name,
    email: rules.email,
    // Blank means "keep the current password"
    password: { ...rules.password, allowEmpty: true },
    role: rules.role,
    status: rules.userStatus,
    phone: rules.phone,
    department: rules.department,
  }),
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
  validateObjectId(),
  deleteUser
);

module.exports = router;