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

// Binary formats must really start with their file signature, so a
// script renamed to .png (and sent as image/png) is still rejected.
const startsWith = (buffer, bytes, offset = 0) =>
  bytes.every((byte, i) => buffer[offset + i] === byte);

const ascii = (text) => [...text].map((char) => char.charCodeAt(0));

const SIGNATURES = {
  "image/png": (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]),
  "image/jpeg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  "image/gif": (b) => startsWith(b, ascii("GIF8")),
  "image/webp": (b) =>
    startsWith(b, ascii("RIFF")) && startsWith(b, ascii("WEBP"), 8),
  "application/pdf": (b) => startsWith(b, ascii("%PDF")),
  // DOCX / XLSX are ZIP files
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
};

// Text formats (txt, log, csv) have no signature; they're served
// with nosniff and as downloads, so they can't run as a page.
const contentMatchesType = (file) => {
  const check = SIGNATURES[file.mimetype];
  return check ? check(file.buffer || Buffer.alloc(0)) : true;
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
    if (!error) {
      const fake = (req.files || []).find(
        (file) => !contentMatchesType(file)
      );

      if (fake) {
        return res.status(400).json({
          success: false,
          message: `"${fake.originalname}" doesn't look like a real ${fake.mimetype.split("/").pop().toUpperCase()} file.`,
        });
      }

      return next();
    }

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
  // Exported for unit tests
  fileFilter,
  ALLOWED,
  contentMatchesType,
};
