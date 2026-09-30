const Activity = require("../models/Activity");
const Ticket = require("../models/Ticket");
const { checkTicketAccess } = require("../utils/ticketAccess");

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
  deleteTicketActivities,
};