const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateTicketCode() {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `CP-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

// Turns an event title into a URL-safe slug, e.g. "Freshers' Night 2026!" -> "freshers-night-2026"
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "event";
}

// Strict-ish email check: proper local@domain.tld shape, no spaces, no consecutive dots.
// Used so we don't send tickets to addresses that are mistyped/incomplete.
const EMAIL_RE = /^(?!.*\.\.)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed !== email) return false; // no leading/trailing whitespace
  if (trimmed.length > 254) return false;
  return EMAIL_RE.test(trimmed);
}

function signUserToken(user) {
  return jwt.sign({ id: user._id, type: "user" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function signAdminToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role, type: "admin" }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "1d",
  });
}

module.exports = {
  generateOtpCode,
  hashOtp,
  generateTicketCode,
  signUserToken,
  signAdminToken,
  slugify,
  isValidEmail,
};
