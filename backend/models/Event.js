const mongoose = require("mongoose");
const crypto = require("crypto");

const ticketTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Regular", "VIP"
    price: { type: Number, required: true, min: 0 },
    quantityTotal: { type: Number, required: true, min: 0 },
    quantitySold: { type: Number, default: 0 },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    venue: { type: String, required: true },
    campus: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
    // Additional gallery images (URLs). Rendered as a responsive grid on the event page.
    images: { type: [String], default: [] },
    // Optional external link (e.g. more info, sponsor page, socials) shown as a button on the event page.
    externalLink: { type: String, default: "" },
    // Optional per-event accent color override (hex, e.g. "#0b6e4f"). Falls back to the site-wide theme if empty.
    themeColor: { type: String, default: "" },
    // Secret token that powers the shareable "event manager" link (/#/manage/:token).
    // Anyone with this link can view this event's details and check tickets in - keep it private.
    managerToken: { type: String, unique: true, sparse: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    tiers: { type: [ticketTierSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

eventSchema.virtual("revenue").get(function () {
  return this.tiers.reduce((sum, t) => sum + t.price * t.quantitySold, 0);
});

eventSchema.virtual("ticketsSold").get(function () {
  return this.tiers.reduce((sum, t) => sum + t.quantitySold, 0);
});

// True once an event ended more than 30 days ago - powers the admin dashboard's
// "clean up old events" reminder. Nothing is auto-deleted; this is just a nudge.
eventSchema.virtual("isStale").get(function () {
  const reference = this.endsAt || this.startsAt;
  if (!reference) return false;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(reference).getTime() > THIRTY_DAYS;
});

eventSchema.methods.generateManagerToken = function () {
  this.managerToken = crypto.randomBytes(12).toString("hex");
  return this.managerToken;
};

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);
