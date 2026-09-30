const express = require("express");

const {
  getTicketAttachments,
  uploadTicketAttachments,
  downloadAttachment,
  deleteAttachment,
} = require("../controllers/attachmentController");

const authMiddleware = require("../middleware/authMiddleware");
const { uploadAttachments } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Every route needs a logged-in user with access to the ticket
router.use(authMiddleware);

router.get("/ticket/:ticketId", getTicketAttachments);

router.post(
  "/ticket/:ticketId",
  uploadAttachments,
  uploadTicketAttachments
);

router.get("/:id/download", downloadAttachment);

router.delete("/:id", deleteAttachment);

module.exports = router;
