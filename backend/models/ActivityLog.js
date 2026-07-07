const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    actorName: { type: String },
    action: { type: String, required: true }, // e.g. "created_event", "checked_in_ticket"
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
