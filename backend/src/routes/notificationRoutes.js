const express = require("express");

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Every route is for the logged-in user's own notifications
router.use(authMiddleware);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);

// "read-all" before "/:id" so it isn't read as an id
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

router.delete("/", clearNotifications);
router.delete("/:id", deleteNotification);

module.exports = router;
