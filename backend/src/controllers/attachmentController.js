const path = require("path");
const mongoose = require("mongoose");

const Attachment = require("../models/Attachment");
const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");
const Comment = require("../models/Comment");
const { checkTicketAccess } = require("../utils/ticketAccess");
const {
  saveFile,
  openDownloadStream,
  deleteFile,
} = require("../services/fileStorage");

// Shown in the browser (?inline=1) instead of downloaded
const INLINE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
];

// Keeps the name readable but safe for headers and file systems
const cleanFilename = (name) => {
  const base = path.basename(name || "file");
  const cleaned = base
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
    .trim()
    .slice(0, 150);

  return cleaned || "file";
};

const toResponse = (attachment) => ({
  _id: attachment._id,
  filename: attachment.filename,
  mimeType: attachment.mimeType,
  size: attachment.size,
  uploadedBy: attachment.uploadedBy,
  comment: attachment.comment || null,
  createdAt: attachment.createdAt,
});

// Loads the ticket by TKT-id and checks the user may see it
const loadTicket = async (req, res) => {
  const ticket = await Ticket.findOne({
    ticketId: req.params.ticketId,
  });

  if (!ticket) {
    res.status(404).json({
      success: false,
      message: "Ticket not found",
    });
    return null;
  }

  if (!(await checkTicketAccess(ticket, req.user))) {
    res.status(403).json({
      success: false,
      message: "You do not have permission to access this ticket",
    });
    return null;
  }

  return ticket;
};

// Loads an attachment by id and checks access to its ticket
const loadAttachment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid attachment id",
    });
    return null;
  }

  const attachment = await Attachment.findById(req.params.id);

  if (!attachment) {
    res.status(404).json({
      success: false,
      message: "Attachment not found",
    });
    return null;
  }

  const ticket = await Ticket.findById(attachment.ticket);

  if (!ticket || !(await checkTicketAccess(ticket, req.user))) {
    res.status(403).json({
      success: false,
      message: "You do not have permission to access this file",
    });
    return null;
  }

  return { attachment, ticket };
};

// =========================
// LIST
// GET /api/attachments/ticket/:ticketId
// =========================

const getTicketAttachments = async (req, res) => {
  try {
    const ticket = await loadTicket(req, res);
    if (!ticket) return;

    const attachments = await Attachment.find({ ticket: ticket._id })
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: attachments.length,
      attachments: attachments.map(toResponse),
    });
  } catch (error) {
    console.error("Get attachments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching attachments",
    });
  }
};

// =========================
// UPLOAD
// POST /api/attachments/ticket/:ticketId
//   multipart: "files" (1-5 files), optional "commentId" to attach
//   them to one of your own comments on this ticket
// =========================

const uploadTicketAttachments = async (req, res) => {
  try {
    const ticket = await loadTicket(req, res);
    if (!ticket) return;

    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please choose at least one file",
      });
    }

    // Optional: attach to a comment (must be yours, on this ticket)
    let comment = null;
    const { commentId } = req.body || {};

    if (commentId) {
      if (!mongoose.isValidObjectId(commentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid comment id",
        });
      }

      comment = await Comment.findOne({
        _id: commentId,
        ticket: ticket._id,
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found on this ticket",
        });
      }

      if (comment.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only attach files to your own comments",
        });
      }
    }

    const created = [];

    for (const file of files) {
      const filename = cleanFilename(file.originalname);

      const fileId = await saveFile({
        buffer: file.buffer,
        filename,
        mimeType: file.mimetype,
        metadata: { ticket: ticket._id },
      });

      try {
        created.push(
          await Attachment.create({
            ticket: ticket._id,
            comment: comment ? comment._id : null,
            fileId,
            filename,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: req.user.id,
          })
        );
      } catch (error) {
        // Don't leave an orphaned file behind
        await deleteFile(fileId);
        throw error;
      }
    }

    await Activity.create({
      ticket: ticket._id,
      user: req.user.id,
      action: "Attachment Added",
      message: `${
        created.length === 1
          ? `Attached ${created[0].filename}`
          : `Attached ${created.length} files`
      }${comment ? " to a comment" : ""}`,
      oldValue: "",
      newValue: created.map((item) => item.filename).join(", "),
    });

    await Attachment.populate(created, {
      path: "uploadedBy",
      select: "name role",
    });

    return res.status(201).json({
      success: true,
      message:
        created.length === 1
          ? "File uploaded"
          : `${created.length} files uploaded`,
      attachments: created.map(toResponse),
    });
  } catch (error) {
    console.error("Upload attachments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading files",
    });
  }
};

// =========================
// DOWNLOAD / PREVIEW
// GET /api/attachments/:id/download   (?inline=1 to preview)
// =========================

const downloadAttachment = async (req, res) => {
  try {
    const found = await loadAttachment(req, res);
    if (!found) return;

    const { attachment } = found;

    const inline =
      req.query.inline === "1" &&
      INLINE_TYPES.includes(attachment.mimeType);

    const asciiName = attachment.filename.replace(/[^\x20-\x7e]/g, "_");

    res.set({
      "Content-Type": attachment.mimeType,
      "Content-Length": attachment.size,
      "Content-Disposition": `${
        inline ? "inline" : "attachment"
      }; filename="${asciiName.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(
        attachment.filename
      )}`,
      "Cache-Control": "private, max-age=3600",
    });

    openDownloadStream(attachment.fileId)
      .on("error", (error) => {
        console.error("Attachment stream error:", error.message);

        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            message: "File content is missing",
          });
        } else {
          res.end();
        }
      })
      .pipe(res);
  } catch (error) {
    console.error("Download attachment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while downloading file",
    });
  }
};

// =========================
// DELETE
// DELETE /api/attachments/:id   (uploader or Admin)
// =========================

const deleteAttachment = async (req, res) => {
  try {
    const found = await loadAttachment(req, res);
    if (!found) return;

    const { attachment, ticket } = found;

    const isUploader =
      attachment.uploadedBy.toString() === req.user.id.toString();

    if (!isUploader && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Only the uploader or an Admin can delete this file",
      });
    }

    await deleteFile(attachment.fileId);
    await attachment.deleteOne();

    await Activity.create({
      ticket: ticket._id,
      user: req.user.id,
      action: "Attachment Removed",
      message: `Removed ${attachment.filename}`,
      oldValue: attachment.filename,
      newValue: "",
    });

    return res.status(200).json({
      success: true,
      message: "File deleted",
    });
  } catch (error) {
    console.error("Delete attachment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting file",
    });
  }
};

// Used when a comment is deleted
const deleteCommentAttachments = async (commentObjectId) => {
  const attachments = await Attachment.find({ comment: commentObjectId });

  for (const attachment of attachments) {
    await deleteFile(attachment.fileId);
  }

  await Attachment.deleteMany({ comment: commentObjectId });
};

// Used when a whole ticket is deleted
const deleteTicketAttachments = async (ticketObjectId) => {
  const attachments = await Attachment.find({ ticket: ticketObjectId });

  for (const attachment of attachments) {
    await deleteFile(attachment.fileId);
  }

  await Attachment.deleteMany({ ticket: ticketObjectId });
};

module.exports = {
  getTicketAttachments,
  uploadTicketAttachments,
  downloadAttachment,
  deleteAttachment,
  deleteTicketAttachments,
  deleteCommentAttachments,
};
