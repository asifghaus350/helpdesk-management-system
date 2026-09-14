const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const admin = require("../config/firebaseAdmin");
const User = require("../models/User");

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Validate Firebase ID token
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required.",
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin
      .auth()
      .verifyIdToken(idToken);

    const {
      email,
      name,
      picture,
      uid,
    } = decodedToken;

    // Google account must have an email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account email is required.",
      });
    }

    // Find existing user
    let user = await User.findOne({
      email: email.toLowerCase(),
    });

    // Create user if it does not exist
    if (!user) {
      const randomPassword = `${uid}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      const hashedPassword = await bcrypt.hash(
        randomPassword,
        10
      );

      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "User",
        status: "Active",
      });
    }

    // Prevent inactive users from logging in
    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive. Please contact an administrator.",
      });
    }

    // Create existing HelpDesk JWT
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

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone || "",
        department: user.department || "",
        profilePicture: picture || "",
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      success: false,
      message:
        "Google authentication failed. Please try again.",
    });
  }
};

module.exports = {
  googleLogin,
};