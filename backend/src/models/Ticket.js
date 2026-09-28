const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Bug", "Support", "Feature Request"],
      required: true,
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Closed"],
      required: true,
      default: "Open",
    },

    // Display name of the assigned engineer
    engineer: {
      type: String,
      default: "",
      trim: true,
    },

    // Assigned engineer's user id (source of truth for access)
    engineerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for the list, filters and stats
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Ticket", ticketSchema);