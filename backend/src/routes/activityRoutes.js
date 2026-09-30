const express = require("express");

const {
  getTicketActivities,
  deleteTicketActivities,
} = require("../controllers/activityController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET TICKET ACTIVITIES
// =========================

router.get(
  "/ticket/:ticketId",
  authMiddleware,
  getTicketActivities
);

// Activities are written only by the server when something
// actually happens (ticket created, status changed, comment, …).
// There is deliberately no POST route, so nobody can add fake
// entries to a ticket's audit history.

// =========================
// DELETE TICKET ACTIVITIES
// =========================

router.delete(
  "/ticket/:ticketId",
  authMiddleware,
  deleteTicketActivities
);

module.exports = router;