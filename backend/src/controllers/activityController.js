const Activity = require("../models/Activity");
const Ticket = require("../models/Ticket");
const { checkTicketAccess } = require("../utils/ticketAccess");

const COMMENT_ACTIONS = [
  "Comment Added",
  "Comment Updated",
  "Comment Deleted",
];

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

    // Older log entries copied the comment text; never send it, so
    // an edited or deleted comment can't be read from the log
    for (const activity of activities) {
      if (COMMENT_ACTIONS.includes(activity.action)) {
        activity.oldValue = "";
        activity.newValue = "";
      }
    }

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

module.exports = {
  getTicketActivities,
};