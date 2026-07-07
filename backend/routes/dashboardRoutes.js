const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/dashboardController");
const { requireAdmin, requireRole } = require("../middleware/auth");

// Event managers are scoped to their own event's tickets/check-in only -
// the wider dashboard (all transactions, all users, logs, etc.) is for
// superadmins/support staff.
router.use(requireAdmin, requireRole("superadmin", "support"));

router.get("/overview", ctrl.overview);
router.get("/revenue-timeseries", ctrl.revenueTimeseries);
router.get("/tickets-by-event", ctrl.ticketsByEvent);
router.get("/payment-breakdown", ctrl.paymentBreakdown);
router.get("/users", ctrl.users);
router.patch("/users/:id/toggle-active", ctrl.toggleUserActive);
router.get("/transactions", ctrl.transactions);
router.get("/transactions/export.csv", ctrl.exportTransactionsCsv);
router.delete("/transactions/cleanup-old-failed", ctrl.cleanupOldFailedTransactions);
router.delete("/transactions/:id", ctrl.deleteTransaction);
router.get("/otp-logs", ctrl.otpLogs);
router.get("/activity-logs", ctrl.activityLogs);
router.get("/recent-signups", ctrl.recentSignups);
router.get("/top-events", ctrl.topEvents);
router.get("/active-sessions", ctrl.activeSessions);
router.get("/settings", ctrl.settings);
router.get("/admins-count", ctrl.adminsCount);

module.exports = router;
