const Activity = require("../models/Activity");
const Ticket = require("../models/Ticket");

// =========================
// GET TICKET ACTIVITIES
// =========================

const getTicketActivities = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // =========================
    // FIND TICKET BY TICKET ID
    // =========================

    const ticket = await Ticket.findOne({
      ticketId: ticketId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // =========================
    // FIND ACTIVITIES
    // =========================

    const activities = await Activity.find({
      ticket: ticket._id,
    })
      .populate(
        "user",
        "name email role"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(
      "Get ticket activities error:",
      error.message
    );

    res.status(500).json({
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

    // =========================
    // VALIDATION
    // =========================

    if (!ticket || !action || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Ticket, action and message are required",
      });
    }

    // =========================
    // VERIFY TICKET
    // =========================

    const existingTicket =
      await Ticket.findById(ticket);

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // =========================
    // CREATE ACTIVITY
    // =========================

    const activity = await Activity.create({
      ticket: existingTicket._id,
      user: req.user.id,
      action,
      message,
      oldValue: oldValue || "",
      newValue: newValue || "",
    });

    // =========================
    // POPULATE USER
    // =========================

    await activity.populate(
      "user",
      "name email role"
    );

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      activity,
    });
  } catch (error) {
    console.error(
      "Create activity error:",
      error.message
    );

    res.status(500).json({
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

    // =========================
    // FIND TICKET
    // =========================

    const ticket = await Ticket.findOne({
      ticketId: ticketId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // =========================
    // DELETE ACTIVITIES
    // =========================

    await Activity.deleteMany({
      ticket: ticket._id,
    });

    res.status(200).json({
      success: true,
      message:
        "Ticket activities deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete ticket activities error:",
      error.message
    );

    res.status(500).json({
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