const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/eventController");
const { requireAdmin } = require("../middleware/auth");

router.get("/", ctrl.listPublic);
router.get("/:id", ctrl.getOne);

router.get("/admin/all", requireAdmin, ctrl.adminList);
router.post("/admin", requireAdmin, ctrl.create);
router.put("/admin/:id", requireAdmin, ctrl.update);
router.delete("/admin/:id", requireAdmin, ctrl.remove);

module.exports = router;
