const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/eventController");
const { requireAdmin, requireRole } = require("../middleware/auth");

router.get("/", ctrl.listPublic);
router.get("/:id", ctrl.getOne);

router.get("/admin/all", requireAdmin, ctrl.adminList);
router.get("/admin/stale", requireAdmin, requireRole("superadmin", "support"), ctrl.staleEvents);
router.post("/admin", requireAdmin, requireRole("superadmin", "support"), ctrl.create);
router.put("/admin/:id", requireAdmin, requireRole("superadmin", "support"), ctrl.update);
router.delete("/admin/:id", requireAdmin, requireRole("superadmin", "support"), ctrl.remove);

module.exports = router;
