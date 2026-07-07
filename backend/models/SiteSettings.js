const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    // there is only ever one of these documents - see getSingleton() below
    siteName: { type: String, default: "CampusPass" },
    heroTitle: { type: String, default: "Your ticket to what's on campus." },
    heroSubtitle: {
      type: String,
      default: "Book, pay with M-Pesa, and get your QR ticket straight to your inbox — no queueing at the gate.",
    },
    footerText: { type: String, default: "Campus events, one tap away." },

    // Theme colors - CSS variables on the public site are overridden with these at runtime.
    inkColor: { type: String, default: "#1b2a4a" }, // primary/dark color
    goldColor: { type: String, default: "#f2c14e" }, // accent color
    paperColor: { type: String, default: "#fbf7ee" }, // background color
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
