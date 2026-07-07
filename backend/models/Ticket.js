const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketCode: { type: String, required: true, unique: true }, // shown as QR / barcode
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    tierName: { type: String, required: true },
    price: { type: Number, required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "checked_in", "cancelled", "refunded"],
      default: "pending_payment",
    },
    checkedInAt: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
