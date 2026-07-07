const mongoose = require("mongoose");

const ticketTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Regular", "VIP"
    price: { type: Number, required: true, min: 0 },
    quantityTotal: { type: Number, required: true, min: 0 },
    quantitySold: { type: Number, default: 0 },
  },
  { _id: true }
);

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    venue: { type: String, required: true },
    campus: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
    gallery: { type: [galleryImageSchema], default: [] },
    externalLink: { type: String, default: "" },
    themeColor: { type: String, default: "" },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    tiers: { type: [ticketTierSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    reminderDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.virtual("revenue").get(function () {
  return this.tiers.reduce((sum, t) => sum + t.price * t.quantitySold, 0);
});

eventSchema.virtual("ticketsSold").get(function () {
  return this.tiers.reduce((sum, t) => sum + t.quantitySold, 0);
});

eventSchema.virtual("needsCleanupReminder").get(function () {
  const reference = this.endsAt || this.startsAt;
  if (!reference) return false;
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  return !this.reminderDismissed && Date.now() - new Date(reference).getTime() > oneMonthMs;
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);
