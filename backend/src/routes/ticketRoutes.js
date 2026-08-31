const express = require("express");

const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
} = require("../controllers/ticketController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

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
// ADMIN ONLY
// =========================

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("Admin"),
  deleteTicket
);

module.exports = router;