// =========================
// E2E TEST HARNESS
// =========================
// Real API scenarios against an in-memory MongoDB and a real backend
// process. The project's own .env / database are never used: MONGO_URI,
// JWT_SECRET and PORT are overridden for the spawned server.

const net = require("net");
const path = require("path");
const { spawn } = require("child_process");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../../src/models/User");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const waitForApi = async (base) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${base}/`);

      if (response.ok) return;
    } catch {
      // Server is still starting
    }

    await delay(150);
  }

  throw new Error("Backend did not become ready in time");
};

const makeUser = async (fields, password) => {
  const user = await User.create({
    name: fields.name,
    email: fields.email,
    password: await bcrypt.hash(password, 4),
    role: fields.role,
    status: fields.status || "Active",
    isOwner: Boolean(fields.isOwner),
    emailVerified: fields.emailVerified !== false,
    // No SMTP in tests: don't try to send notification emails
    preferences: { emailNotifications: false },
  });

  return { ...fields, password, id: user._id.toString() };
};

const startHarness = async () => {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri("helpdesk_e2e");
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: path.resolve(__dirname, "../.."),
    env: {
      ...process.env,
      MONGO_URI: uri,
      JWT_SECRET: "e2e-only-secret",
      FRONTEND_URL: base,
      PORT: String(port),
      SMTP_HOST: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let logs = "";

  child.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });

  try {
    await waitForApi(base);
  } catch (error) {
    child.kill();
    await mongo.stop();
    throw new Error(`${error.message}\n${logs}`);
  }

  await mongoose.connect(uri);

  const seed = {
    admin: await makeUser(
      {
        name: "Test Admin",
        email: "admin@e2e.local",
        role: "Admin",
        isOwner: true,
      },
      "Admin123!"
    ),
    engineer: await makeUser(
      {
        name: "Test Engineer",
        email: "engineer@e2e.local",
        role: "Engineer",
      },
      "Engineer123!"
    ),
    user: await makeUser(
      {
        name: "Test User",
        email: "user@e2e.local",
        role: "User",
      },
      "User123!"
    ),
    unverified: await makeUser(
      {
        name: "Pending Signup",
        email: "pending@e2e.local",
        role: "User",
        emailVerified: false,
      },
      "Pending123!"
    ),
  };

  const api = async (endpoint, { method = "GET", token, body } = {}) => {
    const headers = {};

    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(`${base}${endpoint}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return { status: response.status, data };
  };

  const login = async (account) => {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: { email: account.email, password: account.password },
    });

    if (result.status !== 200) {
      throw new Error(`Login failed for ${account.email}: ${JSON.stringify(result.data)}`);
    }

    return result.data.token;
  };

  const stop = async () => {
    await mongoose.disconnect();
    child.kill();
    await mongo.stop();
  };

  return { base, api, login, seed, stop };
};

module.exports = { startHarness };
