const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendNotificationEmail } = require("./emailService");

// Which preference switches each notification type
const PREFERENCE_FOR_TYPE = {
  ticket_created: "ticketNotifications",
  ticket_assigned: "ticketNotifications",
  ticket_status: "ticketNotifications",
  comment_added: "ticketNotifications",
  user_created: "userNotifications",
  user_deleted: "userNotifications",
};

const frontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");

const uniqueIds = (ids) => [
  ...new Set(
    ids
      .filter(Boolean)
      .map((id) => (id._id || id).toString())
  ),
];

// =========================
// NOTIFY
// =========================
// Creates in-app notifications (and optional emails) for the given
// recipients. The actor never notifies themselves, inactive users
// are skipped, and each user's preferences are respected.
//
// Never throws: a notification problem must not break the ticket,
// comment or user action that triggered it.

const notify = async ({
  recipients,
  actor,
  type,
  title,
  message = "",
  link = "",
  email = false,
}) => {
  try {
    const actorId = actor ? (actor._id || actor).toString() : null;

    const ids = uniqueIds(recipients).filter((id) => id !== actorId);

    if (ids.length === 0) return;

    const users = await User.find({
      _id: { $in: ids },
      status: "Active",
    }).select("email preferences");

    const preferenceKey = PREFERENCE_FOR_TYPE[type];

    // Missing preferences (older accounts) default to "on"
    const wanted = users.filter(
      (user) => user.preferences?.[preferenceKey] !== false
    );

    if (wanted.length === 0) return;

    await Notification.insertMany(
      wanted.map((user) => ({
        user: user._id,
        actor: actorId,
        type,
        title,
        message,
        link,
      }))
    );

    if (!email) return;

    const url = link ? `${frontendUrl()}${link}` : "";

    const emailRecipients = wanted.filter(
      (user) => user.preferences?.emailNotifications !== false
    );

    // Send in the background; the request doesn't wait for SMTP.
    Promise.allSettled(
      emailRecipients.map((user) =>
        sendNotificationEmail({
          to: user.email,
          title,
          message,
          url,
        })
      )
    ).then((results) => {
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.error(
          `Notification email failed for ${failed.length} recipient(s):`,
          failed[0].reason?.message
        );
      }
    });
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};

// All active admins (for "new ticket" / user changes)
const adminIds = async () =>
  (await User.find({ role: "Admin", status: "Active" }).select("_id")).map(
    (user) => user._id
  );

module.exports = {
  notify,
  adminIds,
};
