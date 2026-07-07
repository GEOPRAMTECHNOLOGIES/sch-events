const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/notificationController");
const { requireUser, requireAdmin } = require("../middleware/auth");

router.get("/mine", requireUser, ctrl.myNotifications);

router.get("/admin/all", requireAdmin, ctrl.adminList);
router.post("/admin/send", requireAdmin, ctrl.send);

module.exports = router;
