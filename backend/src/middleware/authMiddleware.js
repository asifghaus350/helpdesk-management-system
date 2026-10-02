const jwt = require("jsonwebtoken");

const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Check Bearer token
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Load the account on every request so deleted,
    // deactivated or re-roled users take effect at once
    // instead of when their token expires.
    const user = await User.findById(decoded.id).select(
      "role status passwordChangedAt isOwner"
    );

    if (!user || user.status !== "Active") {
      return res.status(401).json({
        success: false,
        message: "Account is no longer active",
      });
    }

    // Token was issued before the last password change
    // (e.g. someone else was logged in with the old password).
    // (JWT "iat" is in whole seconds, so compare in seconds: a new
    // token signed in the same second as the change stays valid.)
    if (
      user.passwordChangedAt &&
      decoded.iat <
        Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return res.status(401).json({
        success: false,
        message: "Your password was changed. Please log in again.",
      });
    }

    // Store user information (role from DB, not the token)
    req.user = {
      ...decoded,
      id: user._id.toString(),
      role: user.role,
      isOwner: Boolean(user.isOwner),
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
