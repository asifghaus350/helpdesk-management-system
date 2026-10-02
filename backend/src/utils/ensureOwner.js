const User = require("../models/User");

// =========================
// ENSURE AN OWNER EXISTS
// =========================
// If no account is the Owner yet (fresh database or an install from
// before owners existed), the earliest-created active Admin becomes
// the Owner. Safe to run on every start.

const ensureOwner = async () => {
  try {
    if (await User.exists({ isOwner: true })) return;

    const firstAdmin = await User.findOne({
      role: "Admin",
      status: "Active",
    }).sort({ createdAt: 1 });

    if (!firstAdmin) return;

    await User.updateOne(
      { _id: firstAdmin._id },
      { isOwner: true },
      { timestamps: false }
    );

    console.log(`${firstAdmin.email} is now the Owner account`);
  } catch (error) {
    console.error("Owner setup failed:", error.message);
  }
};

module.exports = ensureOwner;
