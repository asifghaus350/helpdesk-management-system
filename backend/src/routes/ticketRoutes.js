const express = require("express");

const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
} = require("../controllers/ticketController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// CREATE TICKET
// =========================

router.post(
  "/",
  authMiddleware,
  createTicket
);

// =========================
// GET ALL TICKETS
// =========================

router.get(
  "/",
  authMiddleware,
  getTickets
);

// =========================
// GET SINGLE TICKET
// =========================

router.get(
  "/:id",
  authMiddleware,
  getTicketById
);

// =========================
// UPDATE TICKET
// =========================

router.put(
  "/:id",
  authMiddleware,
  updateTicket
);

// =========================
// DELETE TICKET
// =========================

router.delete(
  "/:id",
  authMiddleware,
  deleteTicket
);

module.exports = router;