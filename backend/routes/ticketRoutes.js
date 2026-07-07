const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/ticketController");
const { requireUser, requireAdmin } = require("../middleware/auth");

router.post("/book", requireUser, ctrl.initiateBooking);
router.get("/mine", requireUser, ctrl.myTickets);
router.get("/status/:checkoutRequestId", requireUser, ctrl.transactionStatus);

// Safaricom calls this directly - no auth header from them, must stay public.
router.post("/mpesa/callback", ctrl.mpesaCallback);

router.get("/admin/all", requireAdmin, ctrl.adminListTickets);
router.post("/admin/check-in", requireAdmin, ctrl.checkIn);
router.post("/admin/:id/refund", requireAdmin, ctrl.refund);
router.post("/admin/:id/resend-email", requireAdmin, ctrl.resendTicketEmail);

module.exports = router;
