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
    }).select("engineer");

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
      }
    }

    if (linked > 0) {
      console.log(
        `Linked ${linked} ticket(s) to engineer accounts`
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
