const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    merchantRequestId: { type: String },
    checkoutRequestId: { type: String, index: true },
    mpesaReceiptNumber: { type: String },
    resultCode: { type: Number },
    resultDesc: { type: String },
    status: {
      type: String,
      enum: ["initiated", "success", "failed", "cancelled"],
      default: "initiated",
    },
    rawCallback: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
