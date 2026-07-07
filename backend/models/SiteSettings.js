const mongoose = require("mongoose");

// Singleton document (there is always exactly one). Lets admins edit the
// homepage copy and the app-wide color theme without touching code.
const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "singleton", unique: true },

    siteName: { type: String, default: "CampusPass" },
    heroTitle: { type: String, default: "Your ticket to what's on campus." },
    heroSubtitle: {
      type: String,
      default:
        "Book, pay with M-Pesa, and get your QR ticket straight to your inbox \u2014 no queueing at the gate.",
    },
    footerText: { type: String, default: "CampusPass \u2014 campus events, one tap away." },

    // Theme colors. DeKUT green is the default primary/brand color.
    primaryColor: { type: String, default: "#0B6E4F" }, // DeKUT green
    primaryColorDark: { type: String, default: "#084F39" },
    accentColor: { type: String, default: "#F2C14E" }, // gold ticket-stub accent
    inkColor: { type: String, default: "#1B2A4A" },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ key: "singleton" });
  if (!doc) doc = await this.create({ key: "singleton" });
  return doc;
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
