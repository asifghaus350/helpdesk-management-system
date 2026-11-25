const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");

const {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendEmailChangeEmail,
} = require("../services/emailService");

const DAY_MS = 24 * 60 * 60 * 1000;

const frontendUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";

// Random link token: the raw value goes in the email,
// only its SHA-256 hash is stored.
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const newLinkToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hashed: hashToken(raw) };
};

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

const loginResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  isOwner: Boolean(user.isOwner),
  preferences: user.preferences,
});

// Gives the unverified user a fresh link and emails it
const startEmailVerification = async (user) => {
  const { raw, hashed } = newLinkToken();

  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = new Date(Date.now() + DAY_MS);
  await user.save();

  await sendVerificationEmail(
    user.email,
    user.name,
    `${frontendUrl()}/verify-email/${raw}`
  );
};

// =========================
// REGISTER USER
// =========================
// The account stays unverified (no login) until the link sent to
// the email is opened, so nobody can sign up with an address that
// isn't theirs and later receive its owner's Google login.

const registerUser = async (req, res) => {
  try {
    // Role is never taken from the public request —
    // admins change roles through /api/users.
    // Field formats and lengths are checked by validateBody
    // in authRoutes before this runs.
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    let user = await User.findOne({ email });

    if (user && user.emailVerified !== false) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // Signed up before but never verified: the latest sign-up
      // replaces it. Verifying still needs both the emailed link
      // and this password.
      user.name = name;
      user.password = hashedPassword;
    } else {
      user = new User({
        name,
        email,
        password: hashedPassword,
        role: "User",
        emailVerified: false,
      });
    }

    try {
      await startEmailVerification(user);
    } catch (emailError) {
      console.error("Verification email error:", emailError.message);

      return res.status(502).json({
        success: false,
        message:
          "Your account was created, but we couldn't send the verification email. Please use \"Resend email\" in a few minutes.",
        email,
      });
    }

    res.status(201).json({
      success: true,
      message: `We sent a verification link to ${email}. Open it to activate your account.`,
      verificationRequired: true,
      email,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    console.error("Register error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while registering user",
    });
  }
};

// =========================
// VERIFY EMAIL
// =========================
// Needs the emailed link AND the sign-up password, so whoever
// verifies both owns the inbox and chose the password.

const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: hashToken(req.params.token),
      emailVerificationExpires: { $gt: new Date() },
      emailVerified: false,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This verification link is invalid or has expired. Sign in to get a new one.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message:
          "That isn't the password you signed up with. If you signed up more than once, use the password from your latest sign-up.",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your email is verified, but your account is inactive",
      });
    }

    res.status(200).json({
      success: true,
      message: "Email verified. Welcome to HelpDesk!",
      token: signToken(user),
      user: loginResponse(user),
    });
  } catch (error) {
    console.error("Verify email error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while verifying email",
    });
  }
};

// =========================
// RESEND VERIFICATION EMAIL
// =========================
// Same answer whether or not the account exists.

const resendVerification = async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email, emailVerified: false });

    if (user) {
      try {
        await startEmailVerification(user);
      } catch (emailError) {
        console.error("Verification email error:", emailError.message);

        return res.status(502).json({
          success: false,
          message:
            "We couldn't send the verification email. Please try again later.",
        });
      }
    }

    res.status(200).json({
      success: true,
      message:
        "If this email has an unverified account, we sent a new verification link.",
    });
  } catch (error) {
    console.error("Resend verification error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while sending verification email",
    });
  }
};

// =========================
// REQUEST EMAIL CHANGE (own profile)
// =========================
// Called by updateOwnProfile. The new address is stored as pending
// and only used after the link sent to it is opened.

const requestEmailChange = async (user, newEmail) => {
  const { raw, hashed } = newLinkToken();

  user.pendingEmail = newEmail;
  user.emailChangeToken = hashed;
  user.emailChangeExpires = new Date(Date.now() + DAY_MS);
  await user.save();

  await sendEmailChangeEmail(
    newEmail,
    user.name,
    `${frontendUrl()}/confirm-email/${raw}`
  );
};

// =========================
// CONFIRM EMAIL CHANGE
// =========================

const confirmEmailChange = async (req, res) => {
  try {
    const user = await User.findOne({
      emailChangeToken: hashToken(req.params.token),
      emailChangeExpires: { $gt: new Date() },
    });

    if (!user || !user.pendingEmail) {
      return res.status(400).json({
        success: false,
        message: "This confirmation link is invalid or has expired.",
      });
    }

    const takenBy = await User.findOne({
      email: user.pendingEmail,
      _id: { $ne: user._id },
    });

    if (takenBy) {
      return res.status(400).json({
        success: false,
        message: "Another account already uses this email.",
      });
    }

    user.email = user.pendingEmail;
    user.emailVerified = true;
    user.pendingEmail = "";
    user.emailChangeToken = null;
    user.emailChangeExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Your email is now ${user.email}.`,
      email: user.email,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Another account already uses this email.",
      });
    }

    console.error("Confirm email change error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while confirming email",
    });
  }
};

// =========================
// LOGIN USER
// =========================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check the password first, so the response never reveals
    // whether an account exists or is inactive to someone who
    // doesn't know the password.
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message:
          "Please verify your email first. Open the link we sent to your inbox.",
        email: user.email,
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isOwner: Boolean(user.isOwner),
      preferences: user.preferences,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while logging in",
    });
  }
};

// =========================
// GET CURRENT USER
// =========================

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Authenticated user",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        department: user.department,
        profilePhoto: user.profilePhoto,
        isOwner: Boolean(user.isOwner),
        preferences: user.preferences,
        pendingEmail:
          user.emailChangeExpires && user.emailChangeExpires > new Date()
            ? user.pendingEmail
            : "",
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

// =========================
// CHANGE PASSWORD
// =========================

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    user.password = hashedPassword;

    await user.save();

    // Every other session is now signed out; give this one a
    // fresh token so the user stays logged in here.
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Other devices have been signed out.",
      token,
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while changing password",
    });
  }
};

// =========================
// FORGOT PASSWORD
// =========================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Do not reveal whether an email exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate secure random reset token.
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Store only SHA-256 hash in database.
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedResetToken;

    // Token expires after 15 minutes.
    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    // Create frontend reset URL.
    const resetUrl = `${
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    }/reset-password/${resetToken}`;

    // Send reset email.
try {
  await sendPasswordResetEmail(
    user.email,
    resetUrl
  );
} catch (emailError) {
  console.error(
    "Password reset email error:",
    emailError.message
  );

  // Clear reset token if email could not be sent.
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;

  await user.save();

  // Same answer as for unknown emails, so this endpoint can't be
  // used to find out which accounts exist. The failure is logged.
}

res.status(200).json({
  success: true,
  message:
    "If an account exists with this email, a password reset link has been sent.",
});
  } catch (error) {
    console.error(
      "Forgot password error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while processing password reset request",
    });
  }
};

// =========================
// RESET PASSWORD
// =========================

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const {
      newPassword,
      confirmPassword,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters long",
      });
    }

    // Hash received token.
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid and non-expired token.
    const user = await User.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset token",
      });
    }

    // Prevent reusing current password.
    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    // Hash new password.
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    user.password = hashedPassword;

    // Invalidate reset token immediately.
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // The reset link proved the inbox is theirs
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while resetting password",
    });
  }
};

// =========================
// EXPORT CONTROLLERS
// =========================

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  requestEmailChange,
  confirmEmailChange,
};