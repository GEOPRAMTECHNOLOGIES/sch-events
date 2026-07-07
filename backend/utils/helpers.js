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

// Reasonably strict, standard-shape email check. Used to gate ticket-email
// sending so we never fire off a QR ticket to a malformed/incomplete address.
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(trimmed);
}

// Builds a short, tamper-evident signature for the ticket QR payload so a
// manager's scanner/check-in flow can confirm the code was issued by us
// (not just guessed) before trusting it.
function signTicketPayload(ticketCode) {
  const secret = process.env.JWT_SECRET || "campuspass-fallback-secret";
  return crypto.createHmac("sha256", secret).update(ticketCode).digest("hex").slice(0, 12);
}

function buildQrPayload(ticketCode) {
  return `${ticketCode}.${signTicketPayload(ticketCode)}`;
}

function verifyQrPayload(payload) {
  if (!payload || typeof payload !== "string") return null;
  const [code, sig] = payload.split(".");
  if (!code || !sig) return payload; // plain old-style code, let caller look it up directly
  return sig === signTicketPayload(code) ? code : null;
}

// Confirms every field the ticket email needs is present and well-formed,
// so we never send a half-finished / broken confirmation email.
function ticketEmailPayloadIsComplete({ to, eventTitle, tierName, ticketCode, venue, startsAt, qrDataUrl }) {
  return Boolean(
    isValidEmail(to) &&
      eventTitle &&
      tierName &&
      ticketCode &&
      venue &&
      startsAt &&
      qrDataUrl &&
      qrDataUrl.startsWith("data:image")
  );
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
  isValidEmail,
  buildQrPayload,
  verifyQrPayload,
  ticketEmailPayloadIsComplete,
};
