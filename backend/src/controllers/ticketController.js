const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");
const User = require("../models/User");

// =========================
// CREATE TICKET
// =========================

const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      status,
      engineer,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description and category are required",
      });
    }

    // Generate Ticket ID
    const lastTicket = await Ticket.findOne()
      .sort({ createdAt: -1 })
      .select("ticketId");

    let nextNumber = 1001;

    if (lastTicket && lastTicket.ticketId) {
      const lastNumber = parseInt(
        lastTicket.ticketId.replace("TKT-", ""),
        10
      );

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const ticketId = `TKT-${nextNumber}`;

    // Create ticket
    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      category,
      priority: priority || "Medium",
      status: status || "Open",
      engineer: engineer || "",
      createdBy: req.user.id,
    });

    // =========================
    // CREATE ACTIVITY
    // =========================

    await Activity.create({
      ticket: ticket._id,
      user: req.user.id,
      action: "Ticket Created",
      message: `Ticket ${ticket.ticketId} was created`,
      oldValue: "",
      newValue: ticket.ticketId,
    });

    // =========================
    // ASSIGNMENT ACTIVITY
    // =========================

    if (engineer) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Ticket Assigned",
        message: `Ticket assigned to ${engineer}`,
        oldValue: "",
        newValue: engineer,
      });
    }

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Create ticket error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while creating ticket",
    });
  }
};

// =========================
// GET ALL TICKETS
// =========================

const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate(
        "createdBy",
        "name email role"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error(
      "Get tickets error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching tickets",
    });
  }
};

// =========================
// GET SINGLE TICKET
// =========================

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.id,
    }).populate(
      "createdBy",
      "name email role"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error(
      "Get ticket error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching ticket",
    });
  }
};

// =========================
// UPDATE TICKET
// =========================

const updateTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      status,
      engineer,
    } = req.body;

    // =========================
    // FIND TICKET
    // =========================

    const ticket = await Ticket.findOne({
      ticketId: req.params.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // =========================
    // FIND CURRENT USER
    // =========================

    const currentUser = await User.findById(
      req.user.id
    ).select("name role status");

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    // =========================
    // ADMIN
    // =========================
    // Admin can update any ticket.

    if (currentUser.role === "Admin") {
      // Admin is allowed to continue.
    }

    // =========================
    // ENGINEER
    // =========================

    else if (currentUser.role === "Engineer") {
      // Engineer must be assigned to this ticket.
      if (!ticket.engineer) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update tickets assigned to you",
        });
      }

      // Compare logged-in engineer name
      // with ticket assigned engineer.
      const isAssignedEngineer =
        ticket.engineer.trim().toLowerCase() ===
        currentUser.name.trim().toLowerCase();

      if (!isAssignedEngineer) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update tickets assigned to you",
        });
      }

      // Engineer cannot assign/reassign engineer.
      if (engineer !== undefined) {
        return res.status(403).json({
          success: false,
          message:
            "Engineers are not allowed to assign or reassign tickets",
        });
      }
    }

    // =========================
    // OTHER ROLES
    // =========================

    else {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this ticket",
      });
    }

    // =========================
    // STORE OLD VALUES
    // =========================

    const oldPriority = ticket.priority;
    const oldStatus = ticket.status;
    const oldEngineer = ticket.engineer;

    // =========================
    // TRACK BASIC CHANGES
    // =========================

    const basicFieldsChanged =
      title !== undefined ||
      description !== undefined ||
      category !== undefined;

    // =========================
    // UPDATE BASIC FIELDS
    // =========================

    if (title !== undefined) {
      ticket.title = title;
    }

    if (description !== undefined) {
      ticket.description = description;
    }

    if (category !== undefined) {
      ticket.category = category;
    }

    // =========================
    // UPDATE PRIORITY
    // =========================

    if (priority !== undefined) {
      ticket.priority = priority;
    }

    // =========================
    // UPDATE STATUS
    // =========================

    if (status !== undefined) {
      ticket.status = status;
    }

    // =========================
    // UPDATE ENGINEER
    // =========================
    // Only Admin reaches this point
    // with engineer field allowed.

    if (
      engineer !== undefined &&
      currentUser.role === "Admin"
    ) {
      ticket.engineer = engineer;
    }

    // =========================
    // SAVE TICKET
    // =========================

    await ticket.save();

    // =========================
    // BASIC UPDATE ACTIVITY
    // =========================

    if (basicFieldsChanged) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Ticket Updated",
        message: `Ticket ${ticket.ticketId} information was updated`,
        oldValue: "",
        newValue: "",
      });
    }

    // =========================
    // PRIORITY ACTIVITY
    // =========================

    if (
      priority !== undefined &&
      oldPriority !== ticket.priority
    ) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Priority Changed",
        message: `Priority changed from ${oldPriority} to ${ticket.priority}`,
        oldValue: oldPriority,
        newValue: ticket.priority,
      });
    }

    // =========================
    // STATUS ACTIVITY
    // =========================

    if (
      status !== undefined &&
      oldStatus !== ticket.status
    ) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Status Changed",
        message: `Status changed from ${oldStatus} to ${ticket.status}`,
        oldValue: oldStatus,
        newValue: ticket.status,
      });
    }

    // =========================
    // ENGINEER ASSIGNMENT ACTIVITY
    // =========================

    if (
      engineer !== undefined &&
      currentUser.role === "Admin" &&
      oldEngineer !== ticket.engineer
    ) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Ticket Assigned",
        message: ticket.engineer
          ? `Ticket assigned to ${ticket.engineer}`
          : "Ticket assignment removed",
        oldValue:
          oldEngineer || "Unassigned",
        newValue:
          ticket.engineer || "Unassigned",
      });
    }

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Update ticket error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while updating ticket",
    });
  }
};

// =========================
// DELETE TICKET
// =========================

const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // =========================
    // LOG DELETE ACTIVITY
    // =========================

    await Activity.create({
      ticket: ticket._id,
      user: req.user.id,
      action: "Ticket Deleted",
      message: `Ticket ${ticket.ticketId} was deleted`,
      oldValue: ticket.ticketId,
      newValue: "",
    });

    // =========================
    // DELETE TICKET
    // =========================

    await Ticket.deleteOne({
      ticketId: req.params.id,
    });

    // =========================
    // DELETE RELATED ACTIVITIES
    // =========================

    await Activity.deleteMany({
      ticket: ticket._id,
    });

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete ticket error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while deleting ticket",
    });
  }
};

// =========================
// EXPORT
// =========================

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
};