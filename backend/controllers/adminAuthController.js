const Admin = require("../models/Admin");
const Event = require("../models/Event");
const { signAdminToken, isValidEmail } = require("../utils/helpers");
const logActivity = require("../middleware/logActivity");

function toSafeAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    linkedEvent: admin.linkedEvent
      ? { id: admin.linkedEvent._id || admin.linkedEvent, title: admin.linkedEvent.title, slug: admin.linkedEvent.slug }
      : null,
  };
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: (email || "").toLowerCase() }).populate("linkedEvent", "title slug");
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await admin.comparePassword(password || "");
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    if (!admin.isActive) return res.status(403).json({ message: "This admin account is disabled" });

    admin.lastLoginAt = new Date();
    admin.lastLoginIp = req.ip;
    await admin.save();

    const token = signAdminToken(admin);
    req.admin = admin;
    await logActivity(req, "admin_login", {});

    res.json({ token, admin: toSafeAdmin(admin) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not log in" });
  }
};

exports.me = async (req, res) => {
  const admin = await Admin.findById(req.admin._id).populate("linkedEvent", "title slug");
  res.json({ admin: toSafeAdmin(admin) });
};

// Superadmins can create more admin accounts here (shows in the "Admins" tab of the dashboard).
// When role === "manager", pass linkedEvent so that account only ever sees/validates
// tickets for that one event.
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, linkedEvent } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a complete, correctly formatted email address" });
    }
    const existing = await Admin.findOne({ email: (email || "").toLowerCase() });
    if (existing) return res.status(409).json({ message: "An admin with this email already exists" });

    const finalRole = role || "manager";
    let eventDoc = null;
    if (finalRole === "manager") {
      if (!linkedEvent) return res.status(400).json({ message: "Pick which event this manager is linked to" });
      eventDoc = await Event.findById(linkedEvent);
      if (!eventDoc) return res.status(404).json({ message: "That event doesn't exist" });
    }

    const admin = new Admin({
      name,
      email: email.toLowerCase(),
      role: finalRole,
      linkedEvent: finalRole === "manager" ? linkedEvent : null,
    });
    await admin.setPassword(password);
    await admin.save();

    if (eventDoc) {
      eventDoc.manager = admin._id;
      await eventDoc.save();
    }

    await logActivity(req, "created_admin", { newAdminEmail: admin.email, role: finalRole });
    res.status(201).json({
      message: "Admin created",
      admin: { id: admin._id, name, email, role: admin.role, linkedEvent: eventDoc ? { id: eventDoc._id, title: eventDoc.title, slug: eventDoc.slug } : null },
    });
  } catch (err) {
    res.status(400).json({ message: "Could not create admin", detail: err.message });
  }
};

exports.listAdmins = async (req, res) => {
  const admins = await Admin.find().select("-passwordHash").populate("linkedEvent", "title slug").sort({ createdAt: -1 });
  res.json({ admins });
};
