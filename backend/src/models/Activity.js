const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    // =========================
    // TICKET
    // =========================

    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    // =========================
    // USER WHO PERFORMED ACTION
    // =========================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================
    // ACTIVITY TYPE
    // =========================

    action: {
      type: String,
      enum: [
        "Ticket Created",
        "Ticket Updated",
        "Ticket Assigned",
        "Priority Changed",
        "Status Changed",
        "Comment Added",
        "Comment Updated",
        "Comment Deleted",
        "Ticket Deleted",
      ],
      required: true,
    },

    // =========================
    // ACTIVITY MESSAGE
    // =========================

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // OPTIONAL OLD VALUE
    // =========================

    oldValue: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // OPTIONAL NEW VALUE
    // =========================

    newValue: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// INDEXES
// =========================

// Faster ticket activity lookup
activitySchema.index({
  ticket: 1,
  createdAt: -1,
});

// Faster user activity lookup
activitySchema.index({
  user: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Activity",
  activitySchema
);