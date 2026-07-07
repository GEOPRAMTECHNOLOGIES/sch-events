const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const ctrl = require("../controllers/adminAuthController");
const { requireAdmin, requireRole } = require("../middleware/auth");

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { message: "Too many login attempts" } });

router.post("/login", loginLimiter, ctrl.login);
router.get("/me", requireAdmin, ctrl.me);
router.get("/admins", requireAdmin, requireRole("superadmin"), ctrl.listAdmins);
router.post("/admins", requireAdmin, requireRole("superadmin"), ctrl.createAdmin);
router.patch("/admins/:id/managed-event", requireAdmin, requireRole("superadmin"), ctrl.setManagedEvent);

module.exports = router;
