const express = require("express");

const {
  createTicket,
  getTickets,
  getTicketStats,
  getTicketById,
  updateTicket,
  deleteTicket,
} = require("../controllers/ticketController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  validateBody,
  validateObjectId,
  rules,
  required,
} = require("../middleware/validate");

const router = express.Router();

// =========================
// CREATE TICKET
// =========================

router.post(
  "/",
  authMiddleware,
  validateBody({
    title: required(rules.title),
    description: required(rules.description),
    category: required(rules.category),
    priority: rules.priority,
    status: rules.ticketStatus,
    engineer: { label: "Engineer", type: "string", max: 100, allowEmpty: true },
  }),
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
// TICKET STATS
// (before "/:id" so "stats" isn't read as a ticket id)
// =========================

router.get(
  "/stats",
  authMiddleware,
  getTicketStats
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
  validateBody({
    title: rules.title,
    description: rules.description,
    category: rules.category,
    priority: rules.priority,
    status: rules.ticketStatus,
    engineer: { label: "Engineer", type: "string", max: 100, allowEmpty: true },
    assignToMe: { label: "assignToMe", type: "boolean" },
  }),
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