require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const mpesaRoutes = require("./routes/mpesaRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const siteSettingsRoutes = require("./routes/siteSettingsRoutes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "campuspass-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", siteSettingsRoutes);

// Note: the admin dashboard's hidden route (process.env.ADMIN_ROUTE_SLUG) is a
// FRONTEND route, not a backend one - see frontend/src/App.jsx. The backend only
// needs to protect the /api/dashboard, /api/admin-auth etc. endpoints above,
// which it does via requireAdmin.

app.use((req, res) => res.status(404).json({ message: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] CampusPass API listening on port ${PORT}`));
});
