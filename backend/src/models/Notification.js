const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "ticket_created",
  "ticket_assigned",
  "ticket_status",
  "comment_added",
  "user_created",
  "user_deleted",
];

const notificationSchema = new mongoose.Schema(
  {
    // Who receives it
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who caused it (shown as "by …")
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    // In-app link, e.g. /tickets/TKT-1004
    link: {
      type: String,
      default: "",
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// A user's list (newest first) and their unread count
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

// Old notifications clean themselves up after 90 days
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
