const mongoose = require("mongoose");

// =========================
// REQUEST VALIDATION
// =========================
// Small rule-based checks that run before a controller, so bad input
// gets a clear 400 instead of crashing a controller (e.g. calling
// .toLowerCase() on a number) and returning 500.
//
// Rule options:
//   type:     "string" | "email" | "enum" | "boolean" | "phone"
//   required: field must be present (and non-blank for strings)
//   min/max:  string length limits (after trimming)
//   values:   allowed values for "enum"
//   allowEmpty: optional string fields that may be sent as ""

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{6,20}$/;

const checkField = (label, value, rule) => {
  const missing =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "" && !rule.allowEmpty);

  if (missing) {
    if (rule.required) return `${label} is required.`;
    if (value === undefined || value === null) return "";
  }

  switch (rule.type) {
    case "boolean":
      return typeof value === "boolean" ? "" : `${label} must be true or false.`;

    case "enum":
      return rule.values.includes(value)
        ? ""
        : `${label} must be one of: ${rule.values.join(", ")}.`;

    default: {
      if (typeof value !== "string") return `${label} must be text.`;

      const text = value.trim();

      // Optional field sent as "" (e.g. clearing a phone number)
      if (text === "" && rule.allowEmpty) return "";

      if (rule.min && text.length < rule.min) {
        return `${label} must be at least ${rule.min} characters.`;
      }

      if (rule.max && text.length > rule.max) {
        return `${label} must be ${rule.max} characters or fewer.`;
      }

      if (rule.type === "email" && !EMAIL_PATTERN.test(text)) {
        return "Please enter a valid email address.";
      }

      if (rule.type === "phone" && !PHONE_PATTERN.test(text)) {
        return "Please enter a valid phone number.";
      }

      return "";
    }
  }
};

// validateBody({ email: { label: "Email", type: "email", required: true } })
const validateBody = (rules) => (req, res, next) => {
  const body =
    req.body && typeof req.body === "object" ? req.body : {};

  for (const [field, rule] of Object.entries(rules)) {
    const problem = checkField(
      rule.label || field,
      body[field],
      rule
    );

    if (problem) {
      return res.status(400).json({
        success: false,
        message: problem,
        field,
      });
    }
  }

  return next();
};

// Rejects /:id values that aren't MongoDB ObjectIds (400, not 500)
const validateObjectId = (param = "id") => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  return next();
};

// =========================
// SHARED RULES
// =========================

const ROLES = ["Admin", "Engineer", "User"];
const USER_STATUSES = ["Active", "Inactive"];
const CATEGORIES = ["Bug", "Support", "Feature Request"];
const PRIORITIES = ["High", "Medium", "Low"];
const TICKET_STATUSES = ["Open", "In Progress", "Closed"];

const rules = {
  name: { label: "Name", type: "string", max: 80 },
  email: { label: "Email", type: "email", max: 254 },
  password: { label: "Password", type: "string", min: 6, max: 128 },
  phone: { label: "Phone", type: "phone", allowEmpty: true },
  department: { label: "Department", type: "string", max: 80, allowEmpty: true },
  role: { label: "Role", type: "enum", values: ROLES },
  userStatus: { label: "Status", type: "enum", values: USER_STATUSES },

  title: { label: "Title", type: "string", max: 120 },
  description: { label: "Description", type: "string", max: 2000 },
  category: { label: "Category", type: "enum", values: CATEGORIES },
  priority: { label: "Priority", type: "enum", values: PRIORITIES },
  ticketStatus: { label: "Status", type: "enum", values: TICKET_STATUSES },

  comment: { label: "Comment", type: "string", max: 2000 },
};

const required = (rule) => ({ ...rule, required: true });

module.exports = {
  validateBody,
  validateObjectId,
  rules,
  required,
};
