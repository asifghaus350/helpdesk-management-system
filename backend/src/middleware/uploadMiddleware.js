const path = require("path");
const multer = require("multer");

// =========================
// ATTACHMENT UPLOAD RULES
// =========================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 5; // per upload

// Extension -> MIME types browsers commonly send for it.
// SVG / HTML are left out on purpose: they can carry scripts.
const ALLOWED = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
  ".txt": ["text/plain"],
  ".log": ["text/plain", "application/octet-stream", "text/x-log"],
  ".csv": ["text/csv", "application/vnd.ms-excel", "text/plain"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedTypes = ALLOWED[extension];

  if (allowedTypes && allowedTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  const error = new Error(
    `"${file.originalname}" is not an allowed file type. Allowed: images (PNG, JPG, GIF, WebP), PDF, TXT, LOG, CSV, DOCX, XLSX.`
  );
  error.status = 400;
  return callback(error);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter,
});

// Turns multer's errors into clear 400 responses
const uploadAttachments = (req, res, next) => {
  upload.array("files", MAX_FILES)(req, res, (error) => {
    if (!error) return next();

    let message = error.message;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Each file must be 5 MB or smaller.";
    } else if (
      error.code === "LIMIT_FILE_COUNT" ||
      error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      message = `You can upload up to ${MAX_FILES} files at a time.`;
    }

    return res.status(error.status || 400).json({
      success: false,
      message,
    });
  });
};

module.exports = {
  uploadAttachments,
  MAX_FILE_SIZE,
  MAX_FILES,
};
