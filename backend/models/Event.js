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

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    venue: { type: String, required: true },
    campus: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" }, // kept for backwards compatibility, mirrors images[0]
    images: { type: [String], default: [] }, // responsive gallery - admin can add more than one image URL
    externalLink: { type: String, default: "" }, // e.g. a facebook event page, form, map link etc.
    themeColor: { type: String, default: "" }, // per-event accent color override, e.g. "#0b6e4f"
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    tiers: { type: [ticketTierSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null }, // event manager assigned by admin
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    cleanupRemindedAt: { type: Date, default: null }, // last time the "delete old event?" reminder was shown/acked
  },
  { timestamps: true }
);

eventSchema.virtual("revenue").get(function () {
  return this.tiers.reduce((sum, t) => sum + t.price * t.quantitySold, 0);
});

eventSchema.virtual("ticketsSold").get(function () {
  return this.tiers.reduce((sum, t) => sum + t.quantitySold, 0);
});

// The shareable public link for this event, e.g. /#/event/freshers-night-2026
eventSchema.virtual("shareSlug").get(function () {
  return this.slug;
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

eventSchema.statics.slugify = slugify;

module.exports = mongoose.model("Event", eventSchema);
