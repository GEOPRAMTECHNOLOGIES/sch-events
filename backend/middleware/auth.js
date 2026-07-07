const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

function getToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.token || null;
}

async function requireUser(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) return res.status(401).json({ message: "Not authenticated" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: "Admin authentication required" });
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (payload.type !== "admin") return res.status(401).json({ message: "Admin authentication required" });
    const admin = await Admin.findById(payload.id);
    if (!admin || !admin.isActive) return res.status(401).json({ message: "Admin authentication required" });
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired admin session" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ message: "You don't have permission to do that" });
    }
    next();
  };
}

module.exports = { requireUser, requireAdmin, requireRole };
