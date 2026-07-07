const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/siteSettingsController");
const { requireAdmin, requireRole } = require("../middleware/auth");

router.get("/", ctrl.getPublic);
router.put("/admin", requireAdmin, requireRole("superadmin", "support"), ctrl.update);

module.exports = router;
