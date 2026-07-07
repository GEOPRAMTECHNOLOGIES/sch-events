const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/settingsController");
const { requireAdmin } = require("../middleware/auth");

router.get("/public", ctrl.getPublic);

router.get("/admin", requireAdmin, ctrl.getAdmin);
router.put("/admin", requireAdmin, ctrl.update);

module.exports = router;
