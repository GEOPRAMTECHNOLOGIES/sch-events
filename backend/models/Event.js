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
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    venue: { type: String, required: true },
    campus: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
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

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);
