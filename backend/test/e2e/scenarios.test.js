// =========================
// LIVE API SCENARIOS (in-memory DB)
// =========================
// Roles, tickets, assignment, comments and the user-list flag — all
// exercised through the real Express server, without touching the
// project database or .env.

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");

const { startHarness } = require("./harness");

let h;
let tokens;
let ticketId;

before(async () => {
  h = await startHarness();

  tokens = {
    admin: await h.login(h.seed.admin),
    engineer: await h.login(h.seed.engineer),
    user: await h.login(h.seed.user),
  };
});

after(async () => {
  if (h) await h.stop();
});

test("admin token works and identifies the Owner", async () => {
  const result = await h.api("/api/auth/me", { token: tokens.admin });

  assert.equal(result.status, 200);
  assert.equal(result.data.user.role, "Admin");
  assert.equal(result.data.user.isOwner, true);
});

test("admin can create a ticket with no engineer (Unassigned)", async () => {
  const result = await h.api("/api/tickets", {
    method: "POST",
    token: tokens.admin,
    body: {
      title: "Printer is jammed",
      description: "Second floor printer will not feed paper",
      category: "Bug",
      priority: "High",
      status: "Open",
      engineer: "",
    },
  });

  assert.equal(result.status, 201, JSON.stringify(result.data));
  assert.equal(result.data.ticket.engineer, "");
  assert.equal(result.data.ticket.engineerId, null);

  ticketId = result.data.ticket.ticketId;
});

test("unassigned ticket is listed in the unassigned queue", async () => {
  const result = await h.api("/api/tickets?assigned=unassigned", {
    token: tokens.admin,
  });

  assert.equal(result.status, 200);
  assert.ok(result.data.tickets.some((t) => t.ticketId === ticketId));
});

test("creating a ticket notifies the admins", async () => {
  // The actor is never notified about their own action, so raise this
  // one as a User and check the Admin's inbox.
  const created = await h.api("/api/tickets", {
    method: "POST",
    token: tokens.user,
    body: {
      title: "User raised a ticket",
      description: "Please have a look",
      category: "Support",
      priority: "Low",
    },
  });

  assert.equal(created.status, 201, JSON.stringify(created.data));

  const id = created.data.ticket.ticketId;
  const result = await h.api("/api/notifications", {
    token: tokens.admin,
  });

  assert.equal(result.status, 200);
  assert.ok(
    result.data.notifications.some(
      (n) => n.type === "ticket_created" && n.link === `/tickets/${id}`
    )
  );
});

test("engineer cannot update someone else's ticket", async () => {
  const result = await h.api(`/api/tickets/${ticketId}`, {
    method: "PUT",
    token: tokens.engineer,
    body: { title: "Sneaky edit" },
  });

  assert.equal(result.status, 403);
});

test("plain User cannot update tickets", async () => {
  const result = await h.api(`/api/tickets/${ticketId}`, {
    method: "PUT",
    token: tokens.user,
    body: { title: "Sneaky edit" },
  });

  assert.equal(result.status, 403);
});

test("engineer picks up an unassigned ticket and can then edit it", async () => {
  const picked = await h.api(`/api/tickets/${ticketId}`, {
    method: "PUT",
    token: tokens.engineer,
    body: { assignToMe: true },
  });

  assert.equal(picked.status, 200, JSON.stringify(picked.data));
  assert.equal(picked.data.ticket.engineer, "Test Engineer");

  const edited = await h.api(`/api/tickets/${ticketId}`, {
    method: "PUT",
    token: tokens.engineer,
    body: { title: "Printer still jammed" },
  });

  assert.equal(edited.status, 200);
  assert.equal(edited.data.ticket.title, "Printer still jammed");
});

test("admin can unassign a ticket again", async () => {
  const result = await h.api(`/api/tickets/${ticketId}`, {
    method: "PUT",
    token: tokens.admin,
    body: { engineer: "" },
  });

  assert.equal(result.status, 200);
  assert.equal(result.data.ticket.engineer, "");
  assert.equal(result.data.ticket.engineerId, null);
});

test("comments: author can delete, an engineer cannot delete someone else's", async () => {
  // The ticket was created by Admin, so the Admin can comment on it.
  const added = await h.api(`/api/comments/ticket/${ticketId}`, {
    method: "POST",
    token: tokens.admin,
    body: { message: "I tried restarting it" },
  });

  assert.equal(added.status, 201, JSON.stringify(added.data));

  const commentId = added.data.comment._id;

  const denied = await h.api(`/api/comments/${commentId}`, {
    method: "DELETE",
    token: tokens.engineer,
  });

  assert.equal(denied.status, 403);

  const removed = await h.api(`/api/comments/${commentId}`, {
    method: "DELETE",
    token: tokens.admin,
  });

  assert.equal(removed.status, 200);
});

test("user list exposes the unverified flag", async () => {
  const result = await h.api("/api/users?search=pending", {
    token: tokens.admin,
  });

  assert.equal(result.status, 200);
  assert.equal(result.data.users.length, 1);
  assert.equal(result.data.users[0].unverified, true);

  const engineerRow = await h.api("/api/users?search=engineer", {
    token: tokens.admin,
  });

  assert.equal(engineerRow.data.users[0].unverified, false);
});

test("closed ticket keeps its departed engineer until reopened", async () => {
  const created = await h.api("/api/tickets", {
    method: "POST",
    token: tokens.admin,
    body: {
      title: "VPN drops",
      description: "Disconnects every 10 minutes",
      category: "Support",
      priority: "Medium",
      engineer: h.seed.engineer.id,
    },
  });

  assert.equal(created.status, 201);
  const id = created.data.ticket.ticketId;

  const closed = await h.api(`/api/tickets/${id}`, {
    method: "PUT",
    token: tokens.admin,
    body: { status: "Closed", engineer: h.seed.engineer.id },
  });

  assert.equal(closed.status, 200);

  const deactivated = await h.api(`/api/users/${h.seed.engineer.id}`, {
    method: "PUT",
    token: tokens.admin,
    body: { status: "Inactive" },
  });

  assert.equal(deactivated.status, 200, JSON.stringify(deactivated.data));

  // Editing a Closed ticket must not erase its audit history
  const edited = await h.api(`/api/tickets/${id}`, {
    method: "PUT",
    token: tokens.admin,
    body: { title: "VPN drops (updated)", engineer: h.seed.engineer.id },
  });

  assert.equal(edited.status, 200, JSON.stringify(edited.data));
  assert.equal(edited.data.ticket.engineer, "Test Engineer");

  const reopened = await h.api(`/api/tickets/${id}`, {
    method: "PUT",
    token: tokens.admin,
    body: { status: "Open", engineer: h.seed.engineer.id },
  });

  assert.equal(reopened.status, 200);
  assert.equal(reopened.data.ticket.engineer, "");
  assert.equal(reopened.data.ticket.engineerId, null);
});
