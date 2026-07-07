const mongoose = require("mongoose");

// Singleton document (there is only ever one) so admins can edit the site's
// public-facing copy and color theme without touching code.
const siteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "CampusPass" },
    heroTitle: { type: String, default: "Your ticket to what's on campus." },
    heroSubtitle: {
      type: String,
      default: "Book, pay with M-Pesa, and get your QR ticket straight to your inbox — no queueing at the gate.",
    },
    footerText: { type: String, default: "campus events, one tap away." },
    // Colors - default to a DeKUT-inspired palette (deep university green + gold).
    primaryColor: { type: String, default: "#0B4F2C" },
    accentColor: { type: String, default: "#F2B705" },
    paperColor: { type: String, default: "#FBF7EE" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
