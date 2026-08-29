const Comment = require("../models/Comment");
const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");

// =========================
// GET TICKET COMMENTS
// =========================

const getTicketComments = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const comments = await Comment.find({
      ticket: ticket._id,
    })
      .populate("user", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error(
      "Get ticket comments error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error while fetching comments",
    });
  }
};

// =========================
// CREATE COMMENT
// =========================

const createComment = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    // Find ticket
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Create comment
    const comment = await Comment.create({
      ticket: ticket._id,
      user: req.user.id,
      message: message.trim(),
    });

    // =========================
    // CREATE ACTIVITY
    // =========================

    await Activity.create({
      ticket: ticket._id,
      user: req.user.id,
      action: "Comment Added",
      message: `Comment added to ticket ${ticket.ticketId}`,
      oldValue: "",
      newValue: message.trim(),
    });

    // Get populated comment
    const populatedComment = await Comment.findById(
      comment._id
    ).populate("user", "name email role");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error(
      "Create comment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error while creating comment",
    });
  }
};

// =========================
// UPDATE COMMENT
// =========================

const updateComment = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    // Find comment
    const comment = await Comment.findById(
      req.params.id
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Only comment owner can edit
    if (
      comment.user.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to edit this comment",
      });
    }

    // Store old message
    const oldMessage = comment.message;

    // Update comment
    comment.message = message.trim();

    await comment.save();

    // =========================
    // CREATE ACTIVITY
    // =========================

    await Activity.create({
      ticket: comment.ticket,
      user: req.user.id,
      action: "Comment Updated",
      message: "Comment was updated",
      oldValue: oldMessage,
      newValue: message.trim(),
    });

    // Get updated populated comment
    const updatedComment = await Comment.findById(
      comment._id
    ).populate("user", "name email role");

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error(
      "Update comment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error while updating comment",
    });
  }
};

// =========================
// DELETE COMMENT
// =========================

const deleteComment = async (req, res) => {
  try {
    // Find comment
    const comment = await Comment.findById(
      req.params.id
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Comment owner OR Admin can delete
    const isOwner =
      comment.user.toString() ===
      req.user.id.toString();

    const isAdmin =
      req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to delete this comment",
      });
    }

    // Store values before deletion
    const ticketId = comment.ticket;
    const deletedMessage = comment.message;

    // =========================
    // CREATE ACTIVITY
    // =========================

    await Activity.create({
      ticket: ticketId,
      user: req.user.id,
      action: "Comment Deleted",
      message: "Comment was deleted",
      oldValue: deletedMessage,
      newValue: "",
    });

    // Delete comment
    await Comment.deleteOne({
      _id: comment._id,
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete comment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error while deleting comment",
    });
  }
};

// =========================
// EXPORT
// =========================

module.exports = {
  getTicketComments,
  createComment,
  updateComment,
  deleteComment,
};