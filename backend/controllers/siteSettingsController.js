const SiteSettings = require("../models/SiteSettings");
const logActivity = require("../middleware/logActivity");

const EDITABLE_FIELDS = [
  "siteName",
  "heroTitle",
  "heroSubtitle",
  "footerText",
  "primaryColor",
  "primaryColorDark",
  "accentColor",
  "inkColor",
];

// Public - used by the storefront to render hero copy + theme colors.
exports.getPublic = async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ settings });
};

// Admin - same data, plus lets the settings page know who last changed it.
exports.getAdmin = async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ settings });
};

exports.update = async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        settings[field] = req.body[field];
      }
    }
    settings.updatedBy = req.admin._id;
    await settings.save();
    await logActivity(req, "updated_site_settings", { fields: Object.keys(req.body) });
    res.json({ settings });
  } catch (err) {
    res.status(400).json({ message: "Could not update settings", detail: err.message });
  }
};
