const Activity = require("../models/Activity");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// =========================
// CHECK TICKET ACCESS
// =========================

const checkTicketAccess = async (ticket, user) => {
  // ADMIN
  if (user.role === "Admin") {
    return true;
  }

  // USER
  if (user.role === "User") {
    return (
      ticket.createdBy &&
      ticket.createdBy.toString() === user.id.toString()
    );
  }

  // ENGINEER
  if (user.role === "Engineer") {
    const currentUser = await User.findById(user.id).select(
      "name role"
    );

    if (!currentUser) {
      return false;
    }

    return (
      ticket.engineer &&
      ticket.engineer.trim().toLowerCase() ===
        currentUser.name.trim().toLowerCase()
    );
  }

  return false;
};

// =========================
// GET TICKET ACTIVITIES
// =========================

const getTicketActivities = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({
      ticketId: ticketId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const hasAccess = await checkTicketAccess(
      ticket,
      req.user
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this ticket activity.",
      });
    }

    const activities = await Activity.find({
      ticket: ticket._id,
    })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(
      "Get ticket activities error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching ticket activities",
    });
  }
};

// =========================
// CREATE ACTIVITY
// =========================

const createActivity = async (req, res) => {
  try {
    const {
      ticket,
      action,
      message,
      oldValue,
      newValue,
    } = req.body;

    if (!ticket || !action || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Ticket, action and message are required",
      });
    }

    const existingTicket =
      await Ticket.findById(ticket);

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const hasAccess = await checkTicketAccess(
      existingTicket,
      req.user
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to create activity for this ticket.",
      });
    }

    const allowedActions = [
      "Ticket Created",
      "Ticket Updated",
      "Ticket Assigned",
      "Priority Changed",
      "Status Changed",
      "Comment Added",
      "Comment Updated",
      "Comment Deleted",
      "Ticket Deleted",
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity action.",
      });
    }

    const activity = await Activity.create({
      ticket: existingTicket._id,
      user: req.user.id,
      action,
      message,
      oldValue: oldValue || "",
      newValue: newValue || "",
    });

    await activity.populate(
      "user",
      "name email role"
    );

    return res.status(201).json({
      success: true,
      message: "Activity created successfully",
      activity,
    });
  } catch (error) {
    console.error(
      "Create activity error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating activity",
    });
  }
};

// =========================
// DELETE TICKET ACTIVITIES
// =========================

const deleteTicketActivities = async (
  req,
  res
) => {
  try {
    const { ticketId } = req.params;

    // Only Admin can delete audit history
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only Admin can delete ticket activities.",
      });
    }

    const ticket = await Ticket.findOne({
      ticketId: ticketId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await Activity.deleteMany({
      ticket: ticket._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Ticket activities deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete ticket activities error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting ticket activities",
    });
  }
};

module.exports = {
  getTicketActivities,
  createActivity,
  deleteTicketActivities,
};