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
        message: "Title, description and category are required",
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

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while creating ticket",
    });
  }
};

// =========================
// GET ALL TICKETS
// =========================

const getTickets = async (req, res) => {
  try {
    let filter = {};

    // =========================
    // ADMIN
    // =========================

    if (req.user.role === "Admin") {
      // Admin can see all tickets
      filter = {};
    }

    // =========================
    // ENGINEER
    // =========================

    if (req.user.role === "Engineer") {
      const engineer = await User.findById(req.user.id).select("name");

      if (!engineer) {
        return res.status(404).json({
          success: false,
          message: "Engineer account not found",
        });
      }

      const engineerName = engineer.name?.trim();

      if (!engineerName) {
        return res.status(400).json({
          success: false,
          message: "Engineer name is missing",
        });
      }

      // Engineer can see only tickets assigned to themselves.
      // Case-insensitive exact name matching.
      filter.engineer = {
        $regex: `^${engineerName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      };
    }

    // =========================
    // USER
    // =========================

    if (req.user.role === "User") {
      // User can see only tickets created by themselves.
      filter.createdBy = req.user.id;
    }

    const tickets = await Ticket.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get tickets error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching tickets",
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
    }).populate("createdBy", "name email role");

    // Ticket does not exist
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // =========================
    // ADMIN
    // =========================

    if (req.user.role === "Admin") {
      return res.status(200).json({
        success: true,
        ticket,
      });
    }

    // =========================
    // USER
    // =========================

    if (req.user.role === "User") {
      const ticketOwnerId =
        ticket.createdBy?._id?.toString();

      const loggedInUserId =
        req.user.id?.toString();

      // User can access only own ticket
      if (
        !ticketOwnerId ||
        ticketOwnerId !== loggedInUserId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this ticket",
        });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    }

    // =========================
    // ENGINEER
    // =========================

    if (req.user.role === "Engineer") {
      const engineer = await User.findById(req.user.id)
        .select("name");

      if (!engineer) {
        return res.status(404).json({
          success: false,
          message: "Engineer account not found",
        });
      }

      const loggedInEngineerName =
        engineer.name?.trim().toLowerCase();

      const assignedEngineerName =
        ticket.engineer?.trim().toLowerCase();

      // Engineer can access only assigned ticket
      if (
        !loggedInEngineerName ||
        !assignedEngineerName ||
        assignedEngineerName !== loggedInEngineerName
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this ticket",
        });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    }

    // =========================
    // OTHER ROLES
    // =========================

    return res.status(403).json({
      success: false,
      message:
        "You do not have permission to access this ticket",
    });
  } catch (error) {
    console.error("Get ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket",
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
    // ROLE FLAGS
    // =========================

    const isAdmin =
      req.user.role === "Admin";

    const isEngineer =
      req.user.role === "Engineer";

    const isUser =
      req.user.role === "User";

    // =========================
    // ENGINEER PERMISSIONS
    // =========================

    if (isEngineer) {
      // Ticket must have an assigned engineer
      if (!ticket.engineer) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update tickets assigned to you",
        });
      }

      // Fetch logged-in engineer from database.
      // JWT contains only user ID and role.
      const loggedInEngineer =
        await User.findById(req.user.id).select("name");

      if (!loggedInEngineer) {
        return res.status(404).json({
          success: false,
          message: "Engineer account not found",
        });
      }

      const assignedEngineer =
        ticket.engineer.trim().toLowerCase();

      const currentEngineer =
        (loggedInEngineer.name || "")
          .trim()
          .toLowerCase();

      // Engineer can update ONLY own assigned ticket
      if (
        !currentEngineer ||
        assignedEngineer !== currentEngineer
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update tickets assigned to you",
        });
      }

      // Engineer cannot assign/reassign ticket
      if (engineer !== undefined) {
        return res.status(403).json({
          success: false,
          message:
            "Engineers cannot assign or reassign tickets",
        });
      }
    }

    // =========================
    // USER PERMISSION
    // =========================

    if (isUser) {
      return res.status(403).json({
        success: false,
        message:
          "Users do not have permission to update tickets",
      });
    }

    // =========================
    // UNKNOWN ROLE
    // =========================

    if (!isAdmin && !isEngineer) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update tickets",
      });
    }

    // =========================
    // STORE OLD VALUES
    // =========================

    const oldPriority =
      ticket.priority;

    const oldStatus =
      ticket.status;

    const oldEngineer =
      ticket.engineer;

    // =========================
    // CHECK BASIC CHANGES
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
    // ADMIN ONLY
    // ENGINEER ASSIGNMENT
    // =========================

    if (
      isAdmin &&
      engineer !== undefined
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
        message:
          `Ticket ${ticket.ticketId} information was updated`,
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
        message:
          `Priority changed from ${oldPriority} to ${ticket.priority}`,
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
        message:
          `Status changed from ${oldStatus} to ${ticket.status}`,
        oldValue: oldStatus,
        newValue: ticket.status,
      });
    }

    // =========================
    // ENGINEER ASSIGNMENT ACTIVITY
    // =========================

    if (
      isAdmin &&
      engineer !== undefined &&
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

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Update ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating ticket",
    });
  }
};

// =========================
// DELETE TICKET
// =========================

const deleteTicket = async (req, res) => {
  try {
    // =========================
    // ADMIN ONLY
    // =========================

    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only Admin can delete tickets",
      });
    }

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

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting ticket",
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