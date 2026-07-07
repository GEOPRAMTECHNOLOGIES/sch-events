const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/eventController");
const { requireAdmin, requireRole } = require("../middleware/auth");

router.get("/", ctrl.listPublic);
router.get("/slug/:slug", ctrl.getBySlug);
router.get("/:id", ctrl.getOne);

router.get("/admin/all", requireAdmin, ctrl.adminList);
router.post("/admin", requireAdmin, requireRole("superadmin", "support"), ctrl.create);
router.put("/admin/:id", requireAdmin, requireRole("superadmin", "support"), ctrl.update);
router.delete("/admin/:id", requireAdmin, requireRole("superadmin", "support"), ctrl.remove);
router.post("/admin/:id/dismiss-reminder", requireAdmin, requireRole("superadmin", "support"), ctrl.dismissReminder);

module.exports = router;
