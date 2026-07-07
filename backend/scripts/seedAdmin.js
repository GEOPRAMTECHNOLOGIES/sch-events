/**
 * Run this once after deploying to create your first admin login:
 *
 *   node scripts/seedAdmin.js "Your Name" "you@example.com" "a-strong-password"
 *
 * This writes the admin into the `admins` MongoDB collection with a bcrypt-hashed
 * password - the plaintext password is never stored anywhere. Use this same script
 * (with a different role) any time you need to add another admin from the server,
 * or use the "Admins" tab inside the dashboard once you're logged in as superadmin.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

async function main() {
  const [name, email, password, role] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: node scripts/seedAdmin.js "Full Name" "email@example.com" "password" [role]');
    process.exit(1);
  }

  await connectDB();

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`An admin with email ${email} already exists (id: ${existing._id}). Nothing changed.`);
    await mongoose.disconnect();
    return;
  }

  const admin = new Admin({ name, email: email.toLowerCase(), role: role || "superadmin" });
  await admin.setPassword(password);
  await admin.save();

  console.log("Admin created successfully:");
  console.log(`  name:  ${admin.name}`);
  console.log(`  email: ${admin.email}`);
  console.log(`  role:  ${admin.role}`);
  console.log("\nLog in at: <your-frontend-url>/" + (process.env.ADMIN_ROUTE_SLUG || "control-9f2a71"));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
