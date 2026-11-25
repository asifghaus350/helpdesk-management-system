const Ticket = require("../models/Ticket");
const User = require("../models/User");

// =========================
// BACKFILL ENGINEER IDS
// =========================
// Older tickets only stored the engineer's name. Link them
// to the engineer's user id once, so access checks and
// renames work by id. Safe to run on every start.

const backfillEngineerIds = async () => {
  try {
    const tickets = await Ticket.find({
      engineerId: null,
      engineer: { $ne: "" },
    }).select("engineer status");

    if (tickets.length === 0) {
      return;
    }

    const engineers = await User.find({
      role: "Engineer",
    }).select("name");

    const byName = new Map(
      engineers.map((engineer) => [
        engineer.name.trim().toLowerCase(),
        engineer,
      ])
    );

    let linked = 0;
    let released = 0;

    for (const ticket of tickets) {
      const engineer = byName.get(
        ticket.engineer.trim().toLowerCase()
      );

      if (engineer) {
        await Ticket.updateOne(
          { _id: ticket._id },
          {
            engineerId: engineer._id,
            engineer: engineer.name,
          }
        );

        linked += 1;
      } else if (ticket.status !== "Closed") {
        // No engineer has this name any more. Access is by id only,
        // so nobody could work on it: send it back to the queue.
        // (Closed tickets keep the name as history.)
        await Ticket.updateOne(
          { _id: ticket._id },
          { engineer: "" }
        );

        released += 1;
      }
    }

    if (linked > 0) {
      console.log(
        `Linked ${linked} ticket(s) to engineer accounts`
      );
    }

    if (released > 0) {
      console.log(
        `Moved ${released} ticket(s) of removed engineers to the unassigned queue`
      );
    }
  } catch (error) {
    console.error(
      "Engineer backfill failed:",
      error.message
    );
  }
};

module.exports = backfillEngineerIds;
