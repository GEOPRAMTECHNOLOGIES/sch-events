const SiteSettings = require("../models/SiteSettings");
const logActivity = require("../middleware/logActivity");

// Public - the storefront reads its hero copy and color theme from here.
exports.getPublic = async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ settings });
};

// Admin (superadmin/support) - edit the site name, hero/footer text, and colors.
exports.update = async (req, res) => {
  const { siteName, heroTitle, heroSubtitle, footerText, primaryColor, accentColor, paperColor } = req.body;
  const settings = await SiteSettings.getSingleton();

  if (siteName !== undefined) settings.siteName = siteName;
  if (heroTitle !== undefined) settings.heroTitle = heroTitle;
  if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle;
  if (footerText !== undefined) settings.footerText = footerText;
  if (primaryColor !== undefined) settings.primaryColor = primaryColor;
  if (accentColor !== undefined) settings.accentColor = accentColor;
  if (paperColor !== undefined) settings.paperColor = paperColor;
  settings.updatedBy = req.admin._id;
  await settings.save();

  await logActivity(req, "updated_site_settings", {});
  res.json({ settings });
};
