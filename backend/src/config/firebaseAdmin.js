const admin = require("firebase-admin");
const fs = require("fs");

// Firebase is only needed for Google login.
// If it is not configured, export null instead of
// throwing, so the rest of the API still starts.

const initFirebaseAdmin = () => {
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    console.warn(
      "FIREBASE_SERVICE_ACCOUNT_PATH is missing. Google login is disabled."
    );
    return null;
  }

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn(
      "Firebase service account JSON file was not found. Google login is disabled."
    );
    return null;
  }

  try {
    const serviceAccount = require(serviceAccountPath);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    return admin;
  } catch (error) {
    console.error(
      "Firebase admin init failed. Google login is disabled:",
      error.message
    );
    return null;
  }
};

module.exports = initFirebaseAdmin();
