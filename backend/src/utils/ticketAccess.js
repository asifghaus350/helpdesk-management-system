const mongoose = require("mongoose");

const User = require("../models/User");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// =========================
// IS ASSIGNED ENGINEER
// =========================
// Matches by engineerId. Tickets saved before engineerId
// existed fall back to a case-insensitive name match.

const isAssignedEngineer = (ticket, engineerUser) => {
  if (ticket.engineerId) {
    const assignedId =
      ticket.engineerId._id || ticket.engineerId;

    return (
      assignedId.toString() === engineerUser._id.toString()
    );
  }

  return (
    !!ticket.engineer &&
    ticket.engineer.trim().toLowerCase() ===
      (engineerUser.name || "").trim().toLowerCase()
  );
};

const isUnassigned = (ticket) =>
  !ticket.engineerId && !ticket.engineer;

// =========================
// ENGINEER TICKET FILTER
// =========================
// Engineers see tickets assigned to them plus the
// unassigned queue they can pick work from.

const engineerTicketFilter = (engineerUser) => ({
  $or: [
    { engineerId: engineerUser._id },
    {
      engineerId: null,
      engineer: {
        $regex: `^${escapeRegex(engineerUser.name.trim())}$`,
        $options: "i",
      },
    },
    { engineerId: null, engineer: "" },
  ],
});

// =========================
// RESOLVE ENGINEER
// =========================
// Accepts an engineer's user id (or, for older clients,
// their name) and returns the fields to store on a ticket.
// Returns null when no active engineer matches.

const resolveEngineer = async (value) => {
  if (!value) {
    return { engineerId: null, engineer: "" };
  }

  const query = mongoose.isValidObjectId(value)
    ? { _id: value }
    : {
        name: {
          $regex: `^${escapeRegex(String(value).trim())}$`,
          $options: "i",
        },
      };

  const engineer = await User.findOne({
    ...query,
    role: "Engineer",
    status: "Active",
  }).select("name");

  if (!engineer) {
    return null;
  }

  return {
    engineerId: engineer._id,
    engineer: engineer.name,
  };
};

// =========================
// CHECK TICKET ACCESS
// =========================
// Admin: every ticket
// User: tickets they created
// Engineer: tickets assigned to them + unassigned queue

const checkTicketAccess = async (ticket, user) => {
  // ADMIN
  if (user.role === "Admin") {
    return true;
  }

  // USER
  if (user.role === "User") {
    const creatorId =
      ticket.createdBy?._id || ticket.createdBy;

    return (
      !!creatorId &&
      creatorId.toString() === user.id.toString()
    );
  }

  // ENGINEER
  if (user.role === "Engineer") {
    if (isUnassigned(ticket)) {
      return true;
    }

    const currentUser = await User.findById(user.id).select(
      "name"
    );

    return (
      !!currentUser &&
      isAssignedEngineer(ticket, currentUser)
    );
  }

  return false;
};

module.exports = {
  checkTicketAccess,
  isAssignedEngineer,
  isUnassigned,
  engineerTicketFilter,
  resolveEngineer,
};
