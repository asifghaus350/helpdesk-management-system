const express = require("express");

const {
  getTicketComments,
  createComment,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET TICKET COMMENTS
// =========================

router.get(
  "/ticket/:ticketId",
  authMiddleware,
  getTicketComments
);

// =========================
// CREATE COMMENT
// =========================

router.post(
  "/ticket/:ticketId",
  authMiddleware,
  createComment
);

// =========================
// UPDATE COMMENT
// =========================

router.put(
  "/:id",
  authMiddleware,
  updateComment
);

// =========================
// DELETE COMMENT
// =========================

router.delete(
  "/:id",
  authMiddleware,
  deleteComment
);

module.exports = router;