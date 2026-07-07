const Admin = require("../models/Admin");
const { signAdminToken } = require("../utils/helpers");
const logActivity = require("../middleware/logActivity");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: (email || "").toLowerCase() });
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

    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not log in" });
  }
};

exports.me = async (req, res) => {
  res.json({ admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email, role: req.admin.role } });
};

// Superadmins can create more admin accounts here (shows in the "Admins" tab of the dashboard)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await Admin.findOne({ email: (email || "").toLowerCase() });
    if (existing) return res.status(409).json({ message: "An admin with this email already exists" });

    const admin = new Admin({ name, email: email.toLowerCase(), role: role || "manager" });
    await admin.setPassword(password);
    await admin.save();
    await logActivity(req, "created_admin", { newAdminEmail: admin.email });
    res.status(201).json({ message: "Admin created", admin: { id: admin._id, name, email, role: admin.role } });
  } catch (err) {
    res.status(400).json({ message: "Could not create admin", detail: err.message });
  }
};

exports.listAdmins = async (req, res) => {
  const admins = await Admin.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json({ admins });
};
