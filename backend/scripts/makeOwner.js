// =========================
// MAKE OWNER (command line)
// =========================
// Makes an existing account the Owner: an active Admin with
// isOwner = true. Any previous Owner stays an Admin.
//
// Usage (from the backend folder):
//   npm run make-owner -- someone@example.com
//
// Use it to set up the first Admin on a new database, or to recover
// access if the Owner account was lost.

const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const mongoose = require("mongoose");
const User = require("../src/models/User");

const email = (process.argv[2] || "").trim().toLowerCase();

const main = async () => {
  if (!email) {
    console.error("Usage: npm run make-owner -- someone@example.com");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email });

  if (!user) {
    console.error(
      `No account found for ${email}. Register or log in with that email first, then run this again.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  // Previous owner (if any) stays an Admin
  await User.updateMany(
    { _id: { $ne: user._id }, isOwner: true },
    { isOwner: false }
  );

  await User.updateOne(
    { _id: user._id },
    { role: "Admin", status: "Active", isOwner: true }
  );

  console.log(`${user.name} (${email}) is now the Owner.`);
  console.log("Log out and log in again in the app to see the change.");

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error("make-owner failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
