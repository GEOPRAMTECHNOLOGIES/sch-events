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
};
