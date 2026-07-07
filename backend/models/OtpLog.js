const mongoose = require("mongoose");

const otpLogSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["signup", "login", "reset_password"], default: "signup" },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtpLog", otpLogSchema);
