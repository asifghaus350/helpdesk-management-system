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

    engineer: {
      type: String,
      default: "",
      trim: true,
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

module.exports = mongoose.model("Ticket", ticketSchema);