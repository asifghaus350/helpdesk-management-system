const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const activityRoutes = require("./routes/activityRoutes");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

// =========================
// CONNECT MONGODB
// =========================

connectDB();

// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());

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
// TEST ROUTE
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HelpDesk Backend API is running",
  });
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});