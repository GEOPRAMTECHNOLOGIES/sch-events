const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/ticketController");
const { requireUser, requireAdmin } = require("../middleware/auth");

router.post("/book", requireUser, ctrl.initiateBooking);
router.get("/mine", requireUser, ctrl.myTickets);
router.get("/status/:checkoutRequestId", requireUser, ctrl.transactionStatus);

// Safaricom calls this directly - no auth header from them, must stay public.
router.post("/mpesa/callback", ctrl.mpesaCallback);

// Event-manager link endpoints (token-gated, no separate login - see /#/manage/:token)
router.get("/manager/:token", ctrl.managerEventTickets);
router.post("/manager/:token/check-in", ctrl.checkInByManagerToken);

router.get("/admin/all", requireAdmin, ctrl.adminListTickets);
router.post("/admin/check-in", requireAdmin, ctrl.checkIn);
router.post("/admin/:id/refund", requireAdmin, ctrl.refund);

module.exports = router;
