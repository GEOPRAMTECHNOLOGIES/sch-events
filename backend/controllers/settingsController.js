const SiteSettings = require("../models/SiteSettings");
const logActivity = require("../middleware/logActivity");

// Public - the frontend fetches this on load to render dynamic hero text + theme colors.
exports.getPublic = async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({
    siteName: settings.siteName,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    footerText: settings.footerText,
    inkColor: settings.inkColor,
    goldColor: settings.goldColor,
    paperColor: settings.paperColor,
  });
};

// Admin - full read (same shape, kept separate in case admin-only fields are added later)
exports.getAdmin = async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ settings });
};

exports.update = async (req, res) => {
  const allowed = ["siteName", "heroTitle", "heroSubtitle", "footerText", "inkColor", "goldColor", "paperColor"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const settings = await SiteSettings.getSingleton();
  Object.assign(settings, updates);
  await settings.save();

  await logActivity(req, "updated_site_settings", { fields: Object.keys(updates) });
  res.json({ settings });
};
