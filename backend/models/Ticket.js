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
    // Tracks whether the QR ticket email actually went out, and to a validated, complete address.
    emailStatus: { type: String, enum: ["not_sent", "sent", "failed"], default: "not_sent" },
    emailSentAt: { type: Date },
    emailError: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
