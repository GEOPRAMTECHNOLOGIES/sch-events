const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from your .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected:", mongoose.connection.host);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
