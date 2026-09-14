const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_PATH is missing. Please check backend/.env"
  );
}

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    "Firebase service account JSON file was not found at the configured path."
  );
}

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;