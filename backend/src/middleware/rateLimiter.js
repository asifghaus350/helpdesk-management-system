const rateLimit = require("express-rate-limit");

// Same JSON shape as every other API error
const limitHandler = (message) => (req, res) =>
  res.status(429).json({
    success: false,
    message,
  });

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// =========================
// LOGIN / REGISTER / GOOGLE
// =========================
// Slows down password guessing: 10 attempts per IP
// every 15 minutes. Successful logins don't count.

const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: limitHandler(
    "Too many login attempts. Please wait 15 minutes and try again."
  ),
});

// =========================
// FORGOT / RESET PASSWORD
// =========================
// Every forgot-password request sends an email, so keep it
// low: 5 requests per IP every 15 minutes.

const passwordResetLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: limitHandler(
    "Too many password reset requests. Please wait 15 minutes and try again."
  ),
});

// =========================
// SELF SIGN-UP
// =========================
// Every sign-up sends an email and creates an account, so count
// all of them (successful ones too): 5 per IP per hour.

const registerLimiter = rateLimit({
  windowMs: 4 * FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: limitHandler(
    "Too many sign-ups from this network. Please wait an hour and try again."
  ),
});

// =========================
// VERIFICATION / EMAIL-CHANGE EMAILS
// =========================

const emailLinkLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: limitHandler(
    "Too many email requests. Please wait 15 minutes and try again."
  ),
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  registerLimiter,
  emailLinkLimiter,
};
