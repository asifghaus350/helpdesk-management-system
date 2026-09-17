const bcrypt = require("bcryptjs");
const User = require("../models/User");

// =========================
// GET ALL USERS
// =========================

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// =========================
// GET SINGLE USER
// =========================

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

// =========================
// CREATE USER
// =========================

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      status,
      phone,
      department,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "User",
      status: status || "Active",
      phone: phone || "",
      department: department || "",
    });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      department: user.department,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Create user error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while creating user",
    });
  }
};

// =========================
// UPDATE USER
// =========================

const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      status,
      phone,
      department,
    } = req.body;

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================
    // UPDATE NAME
    // =========================

    if (name !== undefined) {
      user.name = name;
    }

    // =========================
    // UPDATE EMAIL
    // =========================

    if (email !== undefined) {
      const normalizedEmail =
        email.toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "Another user already uses this email",
        });
      }

      user.email = normalizedEmail;
    }

    // =========================
    // UPDATE ROLE
    // =========================

    if (role !== undefined) {
      user.role = role;
    }

    // =========================
    // UPDATE STATUS
    // =========================

    if (status !== undefined) {
      user.status = status;
    }

    // =========================
    // UPDATE PHONE
    // =========================

    if (phone !== undefined) {
      user.phone = phone;
    }

    // =========================
    // UPDATE DEPARTMENT
    // =========================

    if (department !== undefined) {
      user.department = department;
    }

    // =========================
    // UPDATE PASSWORD
    // =========================

    if (password) {
      user.password = await bcrypt.hash(
        password,
        10
      );
    }

    // =========================
    // SAVE USER
    // =========================

    await user.save();

    // =========================
    // RESPONSE
    // =========================

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      department: user.department,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error while updating user",
    });
  }
};

// =========================
// DELETE USER
// =========================

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.deleteOne({
      _id: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete user error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error while deleting user",
    });
  }
};

// =========================
// EXPORT
// =========================

// =========================
// UPDATE OWN PROFILE
// ALL AUTHENTICATED USERS
// =========================

const updateOwnProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
    } = req.body;

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =========================
    // UPDATE NAME
    // =========================

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = name.trim();
    }

    // =========================
    // UPDATE EMAIL
    // =========================

    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty.",
        });
      }

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "Another user already uses this email.",
        });
      }

      user.email = normalizedEmail;
    }

    // =========================
    // UPDATE PHONE
    // =========================

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // =========================
    // SAVE
    // =========================

    await user.save();

    // =========================
    // RESPONSE
    // =========================

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      department: user.department,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: userResponse,
    });
  } catch (error) {
    console.error(
      "Update own profile error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while updating profile.",
    });
  }
};

// =========================
// UPDATE OWN PROFILE PHOTO
// =========================

const updateProfilePhoto = async (req, res) => {
  try {
    const { profilePhoto } = req.body;

    // Validate request
    if (profilePhoto === undefined) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required.",
      });
    }

    // =========================
    // REMOVE PROFILE PHOTO
    // =========================

    if (profilePhoto === "") {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profilePhoto: "" },
        { new: true }
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
    // VALIDATE IMAGE FORMAT
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
    // EXTRACT BASE64 DATA
    // =========================

    const base64Data = profilePhoto.split(",")[1];

    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile photo data.",
      });
    }

    // =========================
    // CHECK IMAGE SIZE
    // =========================

    const imageSize =
      Buffer.from(base64Data, "base64").length;

    const maxSize = 5 * 1024 * 1024;

    if (imageSize > maxSize) {
      return res.status(400).json({
        success: false,
        message: "Profile photo must be 5 MB or smaller.",
      });
    }

    // =========================
    // SAVE PROFILE PHOTO
    // =========================

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update Profile Photo Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile photo.",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateOwnProfile,
  updateProfilePhoto,
};