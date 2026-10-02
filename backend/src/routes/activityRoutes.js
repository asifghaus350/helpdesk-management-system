const express = require("express");

const {
  getTicketActivities,
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
// There is deliberately no POST or DELETE route: the audit history
// can't be faked or wiped through the API.

module.exports = router;