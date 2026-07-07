const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/siteSettingsController");
const { requireAdmin, requireRole } = require("../middleware/auth");

// Public - the storefront reads hero copy + theme colors from here.
router.get("/", ctrl.getPublic);

// Admin - only superadmins can change site-wide branding/copy.
router.get("/admin", requireAdmin, ctrl.getAdmin);
router.put("/admin", requireAdmin, requireRole("superadmin"), ctrl.update);

module.exports = router;
