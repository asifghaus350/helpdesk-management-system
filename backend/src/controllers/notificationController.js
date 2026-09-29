const mongoose = require("mongoose");

const Notification = require("../models/Notification");

// Every query is scoped to the logged-in user, so nobody can
// read or change someone else's notifications.
const mine = (req, extra = {}) => ({
  user: req.user.id,
  ...extra,
});

const invalidId = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid notification id",
  });

// =========================
// LIST
// =========================
// GET /api/notifications?limit=20&unread=true

const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const filter =
      req.query.unread === "true"
        ? mine(req, { read: false })
        : mine(req);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("actor", "name")
        .sort({ createdAt: -1 })
        .limit(limit),

      Notification.countDocuments(mine(req, { read: false })),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

// =========================
// UNREAD COUNT (cheap, for polling the bell)
// =========================

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments(
      mine(req, { read: false })
    );

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Unread count error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while counting notifications",
    });
  }
};

// =========================
// MARK ONE AS READ
// =========================

const markAsRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return invalidId(res);
    }

    const notification = await Notification.findOneAndUpdate(
      mine(req, { _id: req.params.id }),
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notification",
    });
  }
};

// =========================
// MARK ALL AS READ
// =========================

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      mine(req, { read: false }),
      { read: true }
    );

    return res.status(200).json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
};

// =========================
// DELETE ONE
// =========================

const deleteNotification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return invalidId(res);
    }

    const deleted = await Notification.findOneAndDelete(
      mine(req, { _id: req.params.id })
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
    });
  }
};

// =========================
// CLEAR ALL
// =========================

const clearNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany(mine(req));

    return res.status(200).json({
      success: true,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while clearing notifications",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
};
