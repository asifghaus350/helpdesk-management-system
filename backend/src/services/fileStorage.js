const mongoose = require("mongoose");
const { Readable } = require("stream");

// =========================
// GRIDFS FILE STORAGE
// =========================
// Files are stored inside MongoDB, so they survive restarts on
// hosts without a persistent disk (Render, Railway, …).

const BUCKET_NAME = "attachments";

const bucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });

// Saves a buffer and resolves with the new file's ObjectId
const saveFile = ({ buffer, filename, mimeType, metadata = {} }) =>
  new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(filename, {
      metadata: { mimeType, ...metadata },
    });

    Readable.from(buffer)
      .pipe(upload)
      .on("error", reject)
      .on("finish", () => resolve(upload.id));
  });

const openDownloadStream = (fileId) =>
  bucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));

// Deleting a file that is already gone is not an error
const deleteFile = async (fileId) => {
  try {
    await bucket().delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    if (!/FileNotFound|File not found/i.test(error.message)) {
      throw error;
    }
  }
};

module.exports = {
  saveFile,
  openDownloadStream,
  deleteFile,
};
