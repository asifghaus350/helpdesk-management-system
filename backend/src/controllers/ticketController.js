const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Counter = require("../models/Counter");

const {
  checkTicketAccess,
  isAssignedEngineer,
  isUnassigned,
  engineerTicketFilter,
  resolveEngineer,
} = require("../utils/ticketAccess");
const {
  parsePagination,
  buildPagination,
  searchRegex,
  pickAllowed,
  countsByKey,
} = require("../utils/query");

// =========================
// NEXT TICKET ID
// =========================
// Atomic counter so two tickets created at the same time
// never get the same number. On first use the counter is
// seeded from the highest existing TKT-number.

let counterSeeded = false;

const nextTicketId = async () => {
  if (!counterSeeded) {
    const existing = await Ticket.find()
      .select("ticketId")
      .lean();

    const highest = existing.reduce((max, { ticketId }) => {
      const number = parseInt(
        (ticketId || "").replace("TKT-", ""),
        10
      );

      return Number.isNaN(number) ? max : Math.max(max, number);
    }, 1000);

    await Counter.updateOne(
      { _id: "ticket" },
      { $max: { seq: highest } },
      { upsert: true }
    );

    counterSeeded = true;
  }

  const counter = await Counter.findOneAndUpdate(
    { _id: "ticket" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `TKT-${counter.seq}`;
};

// =========================
// CREATE TICKET
// =========================

const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      status,
      engineer,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description and category are required",
      });
    }

    // Only Admin may set status / engineer on create.
    // Everyone else always starts as an unassigned Open ticket.
    const isAdmin = req.user.role === "Admin";

    let assignment = { engineerId: null, engineer: "" };

    if (isAdmin && engineer) {
      assignment = await resolveEngineer(engineer);

      if (!assignment) {
        return res.status(400).json({
          success: false,
          message: "Selected engineer was not found",
        });
      }
    }

    // Generate Ticket ID
    const ticketId = await nextTicketId();

    // Create ticket
    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      category,
      priority: priority || "Medium",
      status: isAdmin ? status || "Open" : "Open",
      engineer: assignment.engineer,
      engineerId: assignment.engineerId,
      createdBy: req.user.id,
    });

    // =========================
    // CREATE ACTIVITY
    // =========================

    await Activity.create({
      ticket: ticket._id,
      user: req.user.id,
      action: "Ticket Created",
      message: `Ticket ${ticket.ticketId} was created`,
      oldValue: "",
      newValue: ticket.ticketId,
    });

    // =========================
    // ASSIGNMENT ACTIVITY
    // =========================

    if (ticket.engineer) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Ticket Assigned",
        message: `Ticket assigned to ${ticket.engineer}`,
        oldValue: "",
        newValue: ticket.engineer,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while creating ticket",
    });
  }
};

// =========================
// VISIBLE TICKETS (by role)
// =========================
// Admin: all · Engineer: assigned + unassigned queue ·
// User: own tickets. Returns null if the account is gone.

const STATUSES = ["Open", "In Progress", "Closed"];
const PRIORITIES = ["High", "Medium", "Low"];
const CATEGORIES = ["Bug", "Support", "Feature Request"];

const visibilityFilter = async (user) => {
  if (user.role === "Admin") {
    return {};
  }

  if (user.role === "Engineer") {
    const engineer = await User.findById(user.id).select("name");

    return engineer ? engineerTicketFilter(engineer) : null;
  }

  // ObjectId (not string) so the filter also works in aggregate()
  return {
    createdBy: new mongoose.Types.ObjectId(user.id),
  };
};

// =========================
// GET ALL TICKETS
// =========================
// Optional query: ?page=&limit=&search=&status=&priority=
//                 &category=&assigned=unassigned
// Without ?page the full list is returned (used by Reports).

const getTickets = async (req, res) => {
  try {
    const baseFilter = await visibilityFilter(req.user);

    if (!baseFilter) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Filters other than status (status tabs need counts
    // across all statuses for the same search).
    const conditions = [baseFilter];

    const search = searchRegex(req.query.search);

    if (search) {
      conditions.push({
        $or: [
          { ticketId: search },
          { title: search },
          { description: search },
          { engineer: search },
        ],
      });
    }

    const priority = pickAllowed(req.query.priority, PRIORITIES);
    if (priority) conditions.push({ priority });

    const category = pickAllowed(req.query.category, CATEGORIES);
    if (category) conditions.push({ category });

    if (req.query.assigned === "unassigned") {
      conditions.push({ engineerId: null, engineer: "" });
    }

    const withoutStatus =
      conditions.length > 1 ? { $and: conditions } : baseFilter;

    const status = pickAllowed(req.query.status, STATUSES);

    const filter = status
      ? { $and: [...conditions, { status }] }
      : withoutStatus;

    const pagination = parsePagination(req.query);

    // Full list (backward compatible)
    if (!pagination.paginate) {
      const tickets = await Ticket.find(filter)
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: tickets.length,
        tickets,
      });
    }

    const [tickets, total, statusRows] = await Promise.all([
      Ticket.find(filter)
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),

      Ticket.countDocuments(filter),

      Ticket.aggregate([
        { $match: withoutStatus },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = countsByKey(statusRows, STATUSES);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
      pagination: buildPagination(pagination, total),
      statusCounts: {
        all: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        ...statusCounts,
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching tickets",
    });
  }
};

// =========================
// TICKET STATS
// =========================
// Counts for dashboard / profile without downloading every
// ticket. Same role visibility as the list.

const getTicketStats = async (req, res) => {
  try {
    const baseFilter = await visibilityFilter(req.user);

    if (!baseFilter) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // ?recent=N latest tickets (default 5, 0 = none)
    const requestedRecent = parseInt(req.query.recent, 10);

    const recentLimit = Number.isNaN(requestedRecent)
      ? 5
      : Math.min(20, Math.max(0, requestedRecent));

    const [statusRows, activePriorityRows, unassigned, recentTickets] =
      await Promise.all([
        Ticket.aggregate([
          { $match: baseFilter },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        Ticket.aggregate([
          { $match: { ...baseFilter, status: { $ne: "Closed" } } },
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),

        Ticket.countDocuments({
          ...baseFilter,
          status: { $ne: "Closed" },
          engineerId: null,
          engineer: "",
        }),

        recentLimit > 0
          ? Ticket.find(baseFilter)
              .populate("createdBy", "name email role")
              .sort({ createdAt: -1 })
              .limit(recentLimit)
          : [],
      ]);

    const byStatus = countsByKey(statusRows, STATUSES);

    return res.status(200).json({
      success: true,
      stats: {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        activeByPriority: countsByKey(activePriorityRows, PRIORITIES),
        unassigned,
      },
      recentTickets,
    });
  } catch (error) {
    console.error("Get ticket stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket stats",
    });
  }
};

// =========================
// GET SINGLE TICKET
// =========================

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.id,
    }).populate("createdBy", "name email role");

    // Ticket does not exist
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const hasAccess = await checkTicketAccess(
      ticket,
      req.user
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this ticket",
      });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching ticket",
    });
  }
};

// =========================
// UPDATE TICKET
// =========================

const updateTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      status,
      engineer,
      assignToMe,
    } = req.body;

    // =========================
    // FIND TICKET
    // =========================

    const ticket = await Ticket.findOne({
      ticketId: req.params.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // =========================
    // ROLE FLAGS
    // =========================

    const isAdmin =
      req.user.role === "Admin";

    const isEngineer =
      req.user.role === "Engineer";

    const isUser =
      req.user.role === "User";

    // =========================
    // ENGINEER PERMISSIONS
    // =========================

    let loggedInEngineer = null;

    if (isEngineer) {
      // Fetch logged-in engineer from database.
      // JWT contains only user ID and role.
      loggedInEngineer =
        await User.findById(req.user.id).select("name");

      if (!loggedInEngineer) {
        return res.status(404).json({
          success: false,
          message: "Engineer account not found",
        });
      }

      // Engineer cannot assign/reassign to someone else
      if (engineer !== undefined) {
        return res.status(403).json({
          success: false,
          message:
            "Engineers cannot assign or reassign tickets",
        });
      }

      // Unassigned ticket: engineer may only pick it up
      if (isUnassigned(ticket)) {
        if (!assignToMe) {
          return res.status(403).json({
            success: false,
            message:
              "Assign this ticket to yourself before updating it",
          });
        }
      } else if (
        !isAssignedEngineer(ticket, loggedInEngineer)
      ) {
        // Engineer can update ONLY own assigned ticket
        return res.status(403).json({
          success: false,
          message:
            "You can only update tickets assigned to you",
        });
      }
    }

    // =========================
    // USER PERMISSION
    // =========================

    if (isUser) {
      return res.status(403).json({
        success: false,
        message:
          "Users do not have permission to update tickets",
      });
    }

    // =========================
    // UNKNOWN ROLE
    // =========================

    if (!isAdmin && !isEngineer) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update tickets",
      });
    }

    // =========================
    // STORE OLD VALUES
    // =========================

    const oldPriority =
      ticket.priority;

    const oldStatus =
      ticket.status;

    const oldEngineer =
      ticket.engineer;

    // =========================
    // CHECK BASIC CHANGES
    // =========================

    const basicFieldsChanged =
      title !== undefined ||
      description !== undefined ||
      category !== undefined;

    // =========================
    // UPDATE BASIC FIELDS
    // =========================

    if (title !== undefined) {
      ticket.title = title;
    }

    if (description !== undefined) {
      ticket.description = description;
    }

    if (category !== undefined) {
      ticket.category = category;
    }

    // =========================
    // UPDATE PRIORITY
    // =========================

    if (priority !== undefined) {
      ticket.priority = priority;
    }

   // =========================
// UPDATE STATUS
// =========================

if (status !== undefined) {
  const allowedStatuses = [
    "Open",
    "In Progress",
    "Closed",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid status. Allowed statuses are Open, In Progress and Closed.",
    });
  }

  ticket.status = status;
}

    // =========================
    // ADMIN ONLY
    // ENGINEER ASSIGNMENT
    // =========================

    if (
      isAdmin &&
      engineer !== undefined
    ) {
      const assignment = await resolveEngineer(engineer);

      if (!assignment) {
        return res.status(400).json({
          success: false,
          message: "Selected engineer was not found",
        });
      }

      ticket.engineer = assignment.engineer;
      ticket.engineerId = assignment.engineerId;
    }

    // Engineer picks up an unassigned ticket
    if (
      isEngineer &&
      assignToMe &&
      isUnassigned(ticket)
    ) {
      ticket.engineer = loggedInEngineer.name;
      ticket.engineerId = loggedInEngineer._id;
    }

    // =========================
    // SAVE TICKET
    // =========================

    await ticket.save();

    // =========================
    // BASIC UPDATE ACTIVITY
    // =========================

    if (basicFieldsChanged) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Ticket Updated",
        message:
          `Ticket ${ticket.ticketId} information was updated`,
        oldValue: "",
        newValue: "",
      });
    }

    // =========================
    // PRIORITY ACTIVITY
    // =========================

    if (
      priority !== undefined &&
      oldPriority !== ticket.priority
    ) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Priority Changed",
        message:
          `Priority changed from ${oldPriority} to ${ticket.priority}`,
        oldValue: oldPriority,
        newValue: ticket.priority,
      });
    }

    // =========================
    // STATUS ACTIVITY
    // =========================

    if (
      status !== undefined &&
      oldStatus !== ticket.status
    ) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Status Changed",
        message:
          `Status changed from ${oldStatus} to ${ticket.status}`,
        oldValue: oldStatus,
        newValue: ticket.status,
      });
    }

    // =========================
    // ENGINEER ASSIGNMENT ACTIVITY
    // =========================

    if (oldEngineer !== ticket.engineer) {
      await Activity.create({
        ticket: ticket._id,
        user: req.user.id,
        action: "Ticket Assigned",
        message: ticket.engineer
          ? `Ticket assigned to ${ticket.engineer}`
          : "Ticket assignment removed",
        oldValue:
          oldEngineer || "Unassigned",
        newValue:
          ticket.engineer || "Unassigned",
      });
    }

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Update ticket error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating ticket",
    });
  }
};

// =========================
// DELETE TICKET
// =========================

const deleteTicket = async (req, res) => {
  try {
    // Only Admin can delete tickets
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only Admin can delete tickets.",
      });
    }

    const { id } = req.params;

    const ticket = await Ticket.findOne({
      ticketId: id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Get deleting user's information
    const deletingUser = await User.findById(
      req.user.id
    ).select("name email role");

    if (!deletingUser) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Create permanent deletion audit record
    await Activity.create({
      ticket: ticket._id,
      user: deletingUser._id,
      action: "Ticket Deleted",
      message: `Ticket ${ticket.ticketId} was deleted by ${deletingUser.name}.`,
      oldValue: ticket.status,
      newValue: "Deleted",
    });

    // Delete the ticket and its comments
    await Ticket.findByIdAndDelete(ticket._id);
    await Comment.deleteMany({ ticket: ticket._id });

    // IMPORTANT:
    // Do NOT delete the ticket's activities.
    // Activity history is the audit trail and must remain preserved.

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete ticket error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting ticket",
    });
  }
};
    

// =========================
// EXPORT
// =========================

module.exports = {
  createTicket,
  getTickets,
  getTicketStats,
  getTicketById,
  updateTicket,
  deleteTicket,
};