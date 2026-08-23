const Ticket = require("../models/Ticket");

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

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error.message);

    res.status(500).json({
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
    console.error("Get tickets error:", error.message);

    res.status(500).json({
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
    console.error("Get ticket error:", error.message);

    res.status(500).json({
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

    const ticket = await Ticket.findOne({
      ticketId: req.params.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Update fields only if provided
    if (title !== undefined) {
      ticket.title = title;
    }

    if (description !== undefined) {
      ticket.description = description;
    }

    if (category !== undefined) {
      ticket.category = category;
    }

    if (priority !== undefined) {
      ticket.priority = priority;
    }

    if (status !== undefined) {
      ticket.status = status;
    }

    if (engineer !== undefined) {
      ticket.engineer = engineer;
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Update ticket error:", error.message);

    res.status(500).json({
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
    const ticket = await Ticket.findOne({
      ticketId: req.params.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await Ticket.deleteOne({
      ticketId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while deleting ticket",
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
};