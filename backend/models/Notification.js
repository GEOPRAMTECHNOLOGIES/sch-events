const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    audience: { type: String, enum: ["all_users", "single_user", "admins"], default: "all_users" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    channel: { type: String, enum: ["in_app", "email", "both"], default: "in_app" },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
