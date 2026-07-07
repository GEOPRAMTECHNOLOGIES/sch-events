const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendNotificationEmail } = require("../utils/mailer");
const logActivity = require("../middleware/logActivity");

exports.myNotifications = async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ audience: "all_users" }, { audience: "single_user", user: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications });
};

// ---- Admin ----

exports.adminList = async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(200);
  res.json({ notifications });
};

exports.send = async (req, res) => {
  try {
    const { title, message, audience, userId, channel } = req.body;

    const notification = await Notification.create({
      title,
      message,
      audience: audience || "all_users",
      user: audience === "single_user" ? userId : undefined,
      channel: channel || "in_app",
      sentBy: req.admin._id,
    });

    if (channel === "email" || channel === "both") {
      let recipients = [];
      if (audience === "single_user") {
        const u = await User.findById(userId);
        if (u) recipients = [u.email];
      } else {
        recipients = (await User.find({ isActive: true }).select("email")).map((u) => u.email);
      }
      // fire-and-forget so a slow SMTP send doesn't block the admin's request
      Promise.all(recipients.map((to) => sendNotificationEmail(to, { title, message }))).catch((e) =>
        console.error("[notify] bulk email error:", e.message)
      );
    }

    await logActivity(req, "sent_notification", { title, audience, channel });
    res.status(201).json({ notification });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Could not send notification", detail: err.message });
  }
};
