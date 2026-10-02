const Ticket = require("../models/Ticket");

// =========================
// BACKFILL closedAt
// =========================
// Tickets closed before closedAt existed get their last update time
// as an approximation, so they still count in resolution-time
// reports. Safe to run on every start.

const backfillClosedAt = async () => {
  try {
    const result = await Ticket.updateMany(
      { status: "Closed", closedAt: null },
      [{ $set: { closedAt: "$updatedAt" } }],
      // timestamps:false — this is a data fix, not a real edit, so
      // the ticket's "Updated" time must stay as it was.
      { updatePipeline: true, timestamps: false }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Set closedAt on ${result.modifiedCount} previously closed ticket(s)`
      );
    }
  } catch (error) {
    console.error("closedAt backfill failed:", error.message);
  }
};

module.exports = backfillClosedAt;
