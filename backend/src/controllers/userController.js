const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Ticket = require("../models/Ticket");
const { notify, adminIds } = require("../services/notificationService");
const {
  parsePagination,
  buildPagination,
  searchRegex,
  pickAllowed,
  countsByKey,
} = require("../utils/query");

// Open / in-progress tickets of an engineer who can no longer work
// on them (deleted, demoted or deactivated) go back to the
// unassigned queue, so another engineer can pick them up.
const releaseEngineerTickets = async (engineerId) => {
  await Ticket.updateMany(
    { engineerId, status: { $ne: "Closed" } },
    { engineerId: null, engineer: "" }
  );
};

// Tickets store the engineer's display name next to
// engineerId, so keep it in sync when a name changes.
const syncEngineerName = async (user) => {
  if (user.role === "Engineer") {
    await Ticket.updateMany(
      { engineerId: user._id },
      { engineer: user.name }
    );
  }
};

// =========================
// ADMIN SAFETY RULES
// =========================
// The system must always keep at least one active Admin, and an
// admin can't lock themselves out by changing their own role or
// status. Returns an error message, or "" when the change is fine.

const isActiveAdmin = (user) =>
  user.role === "Admin" && user.status === "Active";

// Role hierarchy:
//   Owner  -> can manage everyone (except deleting/demoting themselves)
//   Admin  -> can manage Engineers and Users, not other Admins
// Returns { status, message } when the change isn't allowed, else null.
const adminChangeProblem = async ({
  target,
  actor,
  nextRole = target.role,
  nextStatus = target.status,
  deleting = false,
}) => {
  const isSelf = target._id.toString() === actor._id.toString();
  const actorIsOwner = Boolean(actor.isOwner);

  const forbidden = (message) => ({ status: 403, message });

  if (isSelf && deleting) {
    return forbidden(
      target.isOwner
        ? "The Owner account can't be deleted. Transfer ownership to another Admin first."
        : "You can't delete your own account."
    );
  }

  if (
    isSelf &&
    (nextRole !== target.role || nextStatus !== target.status)
  ) {
    return forbidden(
      target.isOwner
        ? "The Owner must stay an active Admin. Transfer ownership first if you want to step down."
        : "You can't change your own role or status. Ask the Owner to do it."
    );
  }

  if (target.isOwner && !isSelf) {
    return forbidden("Only the Owner can change the Owner account.");
  }

  if (target.role === "Admin" && !isSelf && !actorIsOwner) {
    return forbidden("Only the Owner can edit or remove other Admins.");
  }

  if (nextRole === "Admin" && target.role !== "Admin" && !actorIsOwner) {
    return forbidden("Only the Owner can make someone an Admin.");
  }

  const losesAdmin =
    isActiveAdmin(target) &&
    (deleting || nextRole !== "Admin" || nextStatus !== "Active");

  if (losesAdmin) {
    const otherActiveAdmins = await User.countDocuments({
      _id: { $ne: target._id },
      role: "Admin",
      status: "Active",
    });

    if (otherActiveAdmins === 0) {
      return {
        status: 400,
        message:
          "This is the only active Admin. Make another user an active Admin first.",
      };
    }
  }

  return null;
};

// The logged-in admin, with isOwner
const loadActor = (req) =>
  User.findById(req.user.id).select("isOwner role");

// =========================
// GET ALL USERS
// =========================

const ROLES = ["Admin", "Engineer", "User"];
const USER_STATUSES = ["Active", "Inactive"];

const SAFE_USER_FIELDS =
  "-password -resetPasswordToken -resetPasswordExpires";

// Optional query: ?page=&limit=&search=&role=&status=
// Without ?page the full list is returned (engineer dropdown).
const getUsers = async (req, res) => {
  try {
    const conditions = [];

    const search = searchRegex(req.query.search);

    if (search) {
      conditions.push({
        $or: [
          { name: search },
          { email: search },
          { department: search },
        ],
      });
    }

    const status = pickAllowed(req.query.status, USER_STATUSES);
    if (status) conditions.push({ status });

    // Everything except role, so role tabs can show counts
    const withoutRole = conditions.length
      ? { $and: conditions }
      : {};

    const role = pickAllowed(req.query.role, ROLES);

    const filter = role
      ? { $and: [...conditions, { role }] }
      : withoutRole;

    const pagination = parsePagination(req.query);

    // Full list (backward compatible)
    if (!pagination.paginate) {
      const users = await User.find(filter)
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    }

    const [users, total, roleRows, summaryRows] = await Promise.all([
      User.find(filter)
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),

      User.countDocuments(filter),

      User.aggregate([
        { $match: withoutRole },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),

      // Whole-system numbers for the stat cards (ignore filters)
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const roleCounts = countsByKey(roleRows, ROLES);
    const summaryByRole = countsByKey(summaryRows, ROLES);

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
      pagination: buildPagination(pagination, total),
      roleCounts: {
        all: Object.values(roleCounts).reduce((a, b) => a + b, 0),
        ...roleCounts,
      },
      summary: {
        total: Object.values(summaryByRole).reduce((a, b) => a + b, 0),
        active: summaryRows.reduce((sum, row) => sum + row.active, 0),
        byRole: summaryByRole,
      },
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
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
      .select(SAFE_USER_FIELDS);

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

    if (role === "Admin" && !req.user.isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only the Owner can create Admin accounts.",
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

    // Let the other admins know
    await notify({
      recipients: await adminIds(),
      actor: req.user.id,
      type: "user_created",
      title: `New user: ${user.name}`,
      message: `${user.role} · ${user.email}`,
      link: "/users",
    });

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
    // VALIDATE ROLE / STATUS
    // =========================

    if (role !== undefined && !ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles are Admin, Engineer and User.",
      });
    }

    if (status !== undefined && !USER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed statuses are Active and Inactive.",
      });
    }

    const problem = await adminChangeProblem({
      target: user,
      actor: await loadActor(req),
      nextRole: role ?? user.role,
      nextStatus: status ?? user.status,
    });

    if (problem) {
      return res.status(problem.status).json({
        success: false,
        message: problem.message,
      });
    }

    // Own password goes through Change password (needs the current one)
    if (
      password &&
      user._id.toString() === req.user.id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Change your own password from Profile → Security.",
      });
    }

    const wasActiveEngineer =
      user.role === "Engineer" && user.status === "Active";

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

    await syncEngineerName(user);

    if (
      wasActiveEngineer &&
      (user.role !== "Engineer" || user.status !== "Active")
    ) {
      await releaseEngineerTickets(user._id);
    }

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

    const problem = await adminChangeProblem({
      target: user,
      actor: await loadActor(req),
      deleting: true,
    });

    if (problem) {
      return res.status(problem.status).json({
        success: false,
        message: problem.message,
      });
    }

    await User.deleteOne({
      _id: req.params.id,
    });

    if (user.role === "Engineer") {
      await releaseEngineerTickets(user._id);
    }

    await notify({
      recipients: await adminIds(),
      actor: req.user.id,
      type: "user_deleted",
      title: `User removed: ${user.name}`,
      message: `${user.role} · ${user.email}`,
      link: "/users",
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

    await syncEngineerName(user);

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
      ).select(SAFE_USER_FIELDS);

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
    ).select(SAFE_USER_FIELDS);

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

// =========================
// UPDATE OWN PREFERENCES
// ALL AUTHENTICATED USERS
// =========================
// PUT /api/users/profile/preferences
// Body: any of theme, compactMode, ticketNotifications,
//       userNotifications, emailNotifications

const PREFERENCE_RULES = {
  theme: (value) => ["light", "dark"].includes(value),
  compactMode: (value) => typeof value === "boolean",
  ticketNotifications: (value) => typeof value === "boolean",
  userNotifications: (value) => typeof value === "boolean",
  emailNotifications: (value) => typeof value === "boolean",
};

const updatePreferences = async (req, res) => {
  try {
    const updates = {};

    for (const [key, isValid] of Object.entries(PREFERENCE_RULES)) {
      if (req.body[key] === undefined) continue;

      if (!isValid(req.body[key])) {
        return res.status(400).json({
          success: false,
          message: `Invalid value for ${key}`,
        });
      }

      updates[`preferences.${key}`] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No preferences to update",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("preferences");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while saving preferences",
    });
  }
};

// =========================
// TRANSFER OWNERSHIP
// OWNER ONLY
// =========================
// POST /api/users/:id/transfer-ownership
// The target must be another active Admin. The current Owner stays
// an Admin but is no longer the Owner.

const transferOwnership = async (req, res) => {
  try {
    if (!req.user.isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only the Owner can transfer ownership.",
      });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You are already the Owner.",
      });
    }

    const target = await User.findById(req.params.id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (target.role !== "Admin" || target.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Ownership can only be given to an active Admin.",
      });
    }

    // New owner first, so there is never a moment with no Owner
    await User.updateOne({ _id: target._id }, { isOwner: true });
    await User.updateOne({ _id: req.user.id }, { isOwner: false });

    await notify({
      recipients: [target._id],
      actor: req.user.id,
      type: "user_created",
      title: "You are now the Owner of this HelpDesk",
      message: "You can now manage Admins and transfer ownership.",
      link: "/users",
      email: true,
    });

    return res.status(200).json({
      success: true,
      message: `${target.name} is now the Owner.`,
    });
  } catch (error) {
    console.error("Transfer ownership error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while transferring ownership",
    });
  }
};

module.exports = {
  transferOwnership,
  updatePreferences,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateOwnProfile,
  updateProfilePhoto,
};