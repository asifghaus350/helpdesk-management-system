const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

// Load environment variables BEFORE importing routes/controllers
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const activityRoutes = require("./routes/activityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const connectDB = require("./config/db");
const backfillEngineerIds = require("./utils/backfillEngineerIds");

const app = express();

// =========================
// MIDDLEWARE
// =========================

// Security headers (no X-Powered-By, no MIME sniffing, etc.)
app.use(helmet());

// Only the frontend may call this API from a browser.
// FRONTEND_URL can list several origins, comma-separated.
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (curl, Postman,
      // server-to-server) are not browser cross-origin calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS");
      error.status = 403;
      return callback(error);
    },
  })
);

// Profile photos are sent as base64, so only that route
// accepts large bodies; everything else stays small.
app.use(
  "/api/users/profile/photo",
  express.json({ limit: "7mb" })
);
app.use(express.json({ limit: "1mb" }));

// =========================
// AUTH ROUTES
// =========================

app.use("/api/auth", authRoutes);

// =========================
// TICKET ROUTES
// =========================

app.use("/api/tickets", ticketRoutes);

// =========================
// USER ROUTES
// =========================

app.use("/api/users", userRoutes);

// =========================
// COMMENT ROUTES
// =========================

app.use("/api/comments", commentRoutes);

// =========================
// ACTIVITY ROUTES
// =========================

app.use("/api/activities", activityRoutes);

// =========================
// NOTIFICATION ROUTES
// =========================

app.use("/api/notifications", notificationRoutes);

// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HelpDesk Backend API is running",
  });
});

// =========================
// UNKNOWN ROUTES
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =========================
// ERROR HANDLER
// =========================
// Catches anything a route didn't handle, so the API always
// answers with JSON instead of an HTML error page.

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  let status = error.status || error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Request body is not valid JSON";
  } else if (error.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  } else if (error.name === "CastError") {
    status = 400;
    message = "Invalid ID format";
  }

  if (status >= 500) {
    console.error("Unhandled error:", error);
    message = "Internal server error";
  }

  res.status(status).json({
    success: false,
    message,
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

// Connect MongoDB first, then accept requests
const startServer = async () => {
  await connectDB();
  await backfillEngineerIds();

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
};

startServer();