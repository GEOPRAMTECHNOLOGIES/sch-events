const ActivityLog = require("../models/ActivityLog");

async function logActivity(req, action, details = {}) {
  try {
    await ActivityLog.create({
      actor: req.admin?._id,
      actorName: req.admin?.name || "system",
      action,
      details,
      ip: req.ip,
    });
  } catch (err) {
    console.error("[activity-log] failed:", err.message);
  }
}

module.exports = logActivity;
