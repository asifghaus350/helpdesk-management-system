const mongoose = require("mongoose");

// Metadata for a file attached to a ticket. The bytes themselves
// live in MongoDB GridFS (bucket "attachments"), referenced by fileId.

const attachmentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    // Set when the file was attached to a comment (null = the ticket)
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    filename: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attachmentSchema.index({ ticket: 1, createdAt: -1 });

module.exports = mongoose.model("Attachment", attachmentSchema);
