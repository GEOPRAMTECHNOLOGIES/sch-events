const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/dashboardController");
const { requireAdmin } = require("../middleware/auth");

router.use(requireAdmin);

router.get("/overview", ctrl.overview);
router.get("/revenue-timeseries", ctrl.revenueTimeseries);
router.get("/tickets-by-event", ctrl.ticketsByEvent);
router.get("/payment-breakdown", ctrl.paymentBreakdown);
router.get("/users", ctrl.users);
router.patch("/users/:id/toggle-active", ctrl.toggleUserActive);
router.get("/transactions", ctrl.transactions);
router.get("/transactions/export.csv", ctrl.exportTransactionsCsv);
router.delete("/transactions/cleanup", ctrl.cleanupOldTransactions);
router.get("/recent-transactions", ctrl.recentTransactions);
router.get("/stale-events", ctrl.staleEvents);
router.get("/otp-logs", ctrl.otpLogs);
router.get("/activity-logs", ctrl.activityLogs);
router.get("/recent-signups", ctrl.recentSignups);
router.get("/top-events", ctrl.topEvents);
router.get("/active-sessions", ctrl.activeSessions);
router.get("/settings", ctrl.settings);
router.get("/admins-count", ctrl.adminsCount);

module.exports = router;
