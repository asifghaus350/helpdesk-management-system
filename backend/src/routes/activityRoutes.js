const express = require("express");

const {
  getTicketActivities,
  createActivity,
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

// =========================
// CREATE ACTIVITY
// =========================

router.post(
  "/",
  authMiddleware,
  createActivity
);

// =========================
// DELETE TICKET ACTIVITIES
// =========================

router.delete(
  "/ticket/:ticketId",
  authMiddleware,
  deleteTicketActivities
);

module.exports = router;