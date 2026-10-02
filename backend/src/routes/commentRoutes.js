const express = require("express");

const {
  getTicketComments,
  createComment,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const authMiddleware = require("../middleware/authMiddleware");
const {
  validateBody,
  validateObjectId,
  rules,
  required,
} = require("../middleware/validate");

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
  validateBody({ message: required(rules.comment) }),
  createComment
);

// =========================
// UPDATE COMMENT
// =========================

router.put(
  "/:id",
  authMiddleware,
  validateObjectId(),
  validateBody({ message: required(rules.comment) }),
  updateComment
);

// =========================
// DELETE COMMENT
// =========================

router.delete(
  "/:id",
  authMiddleware,
  validateObjectId(),
  deleteComment
);

module.exports = router;