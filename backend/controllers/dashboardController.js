const User = require("../models/User");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");
const OtpLog = require("../models/OtpLog");
const ActivityLog = require("../models/ActivityLog");
const Admin = require("../models/Admin");

// 1. Top-level overview cards
exports.overview = async (req, res) => {
  const [totalUsers, totalEvents, totalTickets, revenueAgg, activeEvents, failedPayments24h] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    Ticket.countDocuments({ status: { $in: ["confirmed", "checked_in"] } }),
    Transaction.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Event.countDocuments({ startsAt: { $gte: new Date() } }),
    Transaction.countDocuments({ status: "failed", createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } }),
  ]);

  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const loggedInNow = await User.countDocuments({ lastLoginAt: { $gte: fifteenMinAgo } });

  res.json({
    totalUsers,
    totalEvents,
    activeEvents,
    totalTicketsSold: totalTickets,
    totalRevenue: revenueAgg[0]?.total || 0,
    failedPayments24h,
    usersOnlineNow: loggedInNow,
  });
};

// 2. Revenue over last 14 days (line chart)
exports.revenueTimeseries = async (req, res) => {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  const rows = await Transaction.aggregate([
    { $match: { status: "success", createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json({ series: rows.map((r) => ({ date: r._id, revenue: r.total, count: r.count })) });
};

// 3. Tickets sold per event (bar chart)
exports.ticketsByEvent = async (req, res) => {
  const rows = await Ticket.aggregate([
    { $match: { status: { $in: ["confirmed", "checked_in"] } } },
    { $group: { _id: "$event", count: { $sum: 1 }, revenue: { $sum: "$price" } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const events = await Event.find({ _id: { $in: rows.map((r) => r._id) } }).select("title");
  const titleMap = Object.fromEntries(events.map((e) => [e._id.toString(), e.title]));
  res.json({
    series: rows.map((r) => ({ event: titleMap[r._id?.toString()] || "Unknown", count: r.count, revenue: r.revenue })),
  });
};

// 4. Payment status breakdown (pie chart)
exports.paymentBreakdown = async (req, res) => {
  const rows = await Transaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  res.json({ series: rows.map((r) => ({ status: r._id, count: r.count })) });
};

// 5. Users table (paginated + search)
exports.users = async (req, res) => {
  const { page = 1, limit = 20, search = "" } = req.query;
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
    : {};
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ user: user.toSafeJSON(), isActive: user.isActive });
};

// 6. Transactions table
exports.transactions = async (req, res) => {
  const { page = 1, limit = 25, status } = req.query;
  const filter = status ? { status } : {};
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("user", "name email phone")
      .populate("event", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);
  res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
};

// 7. CSV export for transactions
exports.exportTransactionsCsv = async (req, res) => {
  const transactions = await Transaction.find().populate("user", "name email").sort({ createdAt: -1 }).limit(5000);
  const header = "date,user,email,amount,phone,status,mpesaReceipt\n";
  const rows = transactions
    .map((t) =>
      [
        t.createdAt.toISOString(),
        (t.user?.name || "").replace(/,/g, " "),
        t.user?.email || "",
        t.amount,
        t.phone,
        t.status,
        t.mpesaReceiptNumber || "",
      ].join(",")
    )
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(header + rows);
};

// 8. OTP / email logs
exports.otpLogs = async (req, res) => {
  const logs = await OtpLog.find().sort({ createdAt: -1 }).limit(200).select("-codeHash");
  res.json({ logs });
};

// 9. Admin activity log
exports.activityLogs = async (req, res) => {
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(200);
  res.json({ logs });
};

// 10. Recent signups feed
exports.recentSignups = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(15).select("name email createdAt isVerified");
  res.json({ users });
};

// 11. Top events leaderboard
exports.topEvents = async (req, res) => {
  const events = await Event.find().lean();
  const ranked = events
    .map((e) => ({
      id: e._id,
      title: e.title,
      revenue: e.tiers.reduce((s, t) => s + t.price * t.quantitySold, 0),
      ticketsSold: e.tiers.reduce((s, t) => s + t.quantitySold, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  res.json({ events: ranked });
};

// 12. Live/active sessions widget (users seen in the last 15 minutes)
exports.activeSessions = async (req, res) => {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const users = await User.find({ lastLoginAt: { $gte: since } })
    .select("name email lastLoginAt lastLoginIp")
    .sort({ lastLoginAt: -1 });
  res.json({ users });
};

// 13. System/config settings snapshot (secrets masked)
exports.settings = async (req, res) => {
  const mask = (v) => (v ? v.slice(0, 3) + "***" + v.slice(-2) : "not set");
  res.json({
    mpesaEnv: process.env.MPESA_ENV,
    mpesaShortcode: mask(process.env.MPESA_SHORTCODE),
    mpesaPartyB: mask(process.env.MPESA_PARTYB),
    gmailUser: process.env.GMAIL_USER,
    mongoConnected: true,
    adminRouteSlug: process.env.ADMIN_ROUTE_SLUG,
  });
};

exports.adminsCount = async (req, res) => {
  res.json({ count: await Admin.countDocuments() });
};
