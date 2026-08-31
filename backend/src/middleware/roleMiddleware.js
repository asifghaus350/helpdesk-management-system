// =========================
// ROLE AUTHORIZATION MIDDLEWARE
// =========================

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Authentication middleware should run first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check user role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to perform this action",
        });
      }

      next();
    } catch (error) {
      console.error(
        "Role authorization error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error during authorization",
      });
    }
  };
};

module.exports = authorizeRoles;