const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
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

// =========================
// UPDATE OWN PROFILE PHOTO
// =========================

const updateProfilePhoto = async (req, res) => {
  try {
    const { profilePhoto } = req.body;

    // =========================
    // VALIDATE PHOTO FIELD
    // =========================

    if (profilePhoto === undefined) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required.",
      });
    }

    // =========================
    // REMOVE PHOTO
    // =========================

    if (profilePhoto === "") {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          profilePhoto: "",
        },
        {
          new: true,
        }
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile photo removed successfully.",
        user,
      });
    }

    // =========================
    // BASIC DATA URL VALIDATION
    // =========================

    const photoPattern =
      /^data:image\/(jpeg|jpg|png|webp);base64,/i;

    if (!photoPattern.test(profilePhoto)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid image format. Only JPG, JPEG, PNG and WebP are allowed.",
      });
    }

    // =========================
    // SIZE VALIDATION
    // =========================

    const base64Data =
      profilePhoto.split(",")[1];

    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile photo data.",
      });
    }

    const imageSize =
      Buffer.from(base64Data, "base64").length;

    const maxSize = 5 * 1024 * 1024;

    if (imageSize > maxSize) {
      return res.status(400).json({
        success: false,
        message:
          "Profile photo must be 5 MB or smaller.",
      });
    }

    // =========================
    // UPDATE USER PHOTO
    // =========================

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        profilePhoto,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      user,
    });
  } catch (error) {
    console.error(
      "Update profile photo error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while updating profile photo.",
    });
  }
};

module.exports = router;