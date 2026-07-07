const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "manager", "support"], default: "manager" },
    // For role === "manager": the single event this account is allowed to see/validate tickets for.
    linkedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
  },
  { timestamps: true }
);

adminSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

adminSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model("Admin", adminSchema);
