const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["Admin", "Engineer", "User"],
      default: "User",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

        department: {
      type: String,
      trim: true,
      default: "",
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    // App settings (saved per account, same on every device)
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      compactMode: {
        type: Boolean,
        default: false,
      },
      ticketNotifications: {
        type: Boolean,
        default: true,
      },
      userNotifications: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // The account that owns this HelpDesk. Exactly one user has it.
    // Only the Owner can create, change or remove Admins, and nobody
    // can delete or demote the Owner (ownership can be transferred).
    isOwner: {
      type: Boolean,
      default: false,
    },

    // Set whenever the password changes. Login tokens issued
    // before this moment stop working (see authMiddleware).
    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // Forgot Password / Reset Password
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Self-signup accounts start unverified and can't log in until
    // the link sent to their email is opened. Defaults to true so
    // existing, admin-created and Google accounts count as verified.
    emailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerificationToken: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // Own-profile email change: the new address only replaces the
    // current one after the link sent to it is opened.
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    emailChangeToken: {
      type: String,
      default: null,
    },

    emailChangeExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Covers every way a password changes: change password, reset
// password and an admin setting a new one.
userSchema.pre("save", function markPasswordChange() {
  if (this.isModified("password") && !this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

module.exports = mongoose.model("User", userSchema);