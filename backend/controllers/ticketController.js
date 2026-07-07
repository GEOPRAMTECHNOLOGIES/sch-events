const QRCode = require("qrcode");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");
const { initiateStkPush } = require("../utils/mpesa");
const { generateTicketCode } = require("../utils/helpers");
const { sendTicketConfirmationEmail } = require("../utils/mailer");
const logActivity = require("../middleware/logActivity");

// Step 1: user picks a tier and phone number -> we create a pending ticket + transaction
// and trigger an STK push prompt on their phone.
exports.initiateBooking = async (req, res) => {
  try {
    const { eventId, tierId, phone } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const tier = event.tiers.id(tierId);
    if (!tier) return res.status(404).json({ message: "Ticket type not found" });
    if (tier.quantitySold >= tier.quantityTotal) {
      return res.status(400).json({ message: "This ticket type is sold out" });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      event: event._id,
      amount: tier.price,
      phone,
      status: "initiated",
    });

    const ticket = await Ticket.create({
      ticketCode: generateTicketCode(),
      user: req.user._id,
      event: event._id,
      tierName: tier.name,
      price: tier.price,
      transaction: transaction._id,
      status: "pending_payment",
    });

    // Free events skip M-Pesa entirely
    if (tier.price === 0) {
      transaction.status = "success";
      await transaction.save();
      ticket.status = "confirmed";
      await ticket.save();
      tier.quantitySold += 1;
      await event.save();
      await deliverTicketEmail(ticket, event);
      return res.json({ free: true, ticket });
    }

    const stkResponse = await initiateStkPush({
      phone,
      amount: tier.price,
      accountReference: ticket.ticketCode,
      transactionDesc: `${event.title} - ${tier.name}`,
    });

    transaction.merchantRequestId = stkResponse.MerchantRequestID;
    transaction.checkoutRequestId = stkResponse.CheckoutRequestID;
    await transaction.save();

    res.json({
      message: "Check your phone and enter your M-Pesa PIN to complete payment",
      checkoutRequestId: stkResponse.CheckoutRequestID,
      ticketId: ticket._id,
    });
  } catch (err) {
    console.error("initiateBooking error:", err.response?.data || err.message);
    res.status(500).json({ message: "Could not start payment. Please try again." });
  }
};

async function deliverTicketEmail(ticket, event) {
  try {
    // High error-correction + larger size so the code still scans even if the email
    // client compresses/resizes the embedded image.
    const qrDataUrl = await QRCode.toDataURL(ticket.ticketCode, { errorCorrectionLevel: "H", width: 400, margin: 2 });
    const User = require("../models/User");
    const user = await User.findById(ticket.user);
    await sendTicketConfirmationEmail(user.email, {
      eventTitle: event.title,
      tierName: ticket.tierName,
      ticketCode: ticket.ticketCode,
      venue: event.venue,
      startsAt: event.startsAt,
      qrDataUrl,
    });
  } catch (err) {
    console.error("[email] ticket confirmation failed:", err.message);
  }
}

// Safaricom calls this URL after the customer completes (or cancels) the STK prompt.
exports.mpesaCallback = async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(400).json({ message: "Malformed callback" });

    const transaction = await Transaction.findOne({ checkoutRequestId: body.CheckoutRequestID });
    if (!transaction) {
      console.warn("[mpesa] callback for unknown transaction", body.CheckoutRequestID);
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    transaction.resultCode = body.ResultCode;
    transaction.resultDesc = body.ResultDesc;
    transaction.rawCallback = body;

    if (body.ResultCode === 0) {
      const items = body.CallbackMetadata?.Item || [];
      const get = (name) => items.find((i) => i.Name === name)?.Value;
      transaction.mpesaReceiptNumber = get("MpesaReceiptNumber");
      transaction.status = "success";
    } else {
      transaction.status = body.ResultCode === 1032 ? "cancelled" : "failed";
    }
    await transaction.save();

    if (transaction.status === "success") {
      const ticket = await Ticket.findOne({ transaction: transaction._id });
      if (ticket && ticket.status !== "confirmed") {
        ticket.status = "confirmed";
        await ticket.save();
        const event = await Event.findById(ticket.event);
        const tier = event.tiers.find((t) => t.name === ticket.tierName);
        if (tier) {
          tier.quantitySold += 1;
          await event.save();
        }
        await deliverTicketEmail(ticket, event);
      }
    } else {
      await Ticket.findOneAndUpdate({ transaction: transaction._id }, { status: "cancelled" });
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("mpesaCallback error:", err.message);
    res.json({ ResultCode: 0, ResultDesc: "Accepted" }); // always ack Safaricom
  }
};

exports.transactionStatus = async (req, res) => {
  const transaction = await Transaction.findOne({ checkoutRequestId: req.params.checkoutRequestId });
  if (!transaction) return res.status(404).json({ message: "Not found" });
  res.json({ status: transaction.status });
};

exports.myTickets = async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id }).populate("event").sort({ createdAt: -1 });
  res.json({ tickets });
};

// ---- Admin ----

exports.adminListTickets = async (req, res) => {
  const tickets = await Ticket.find()
    .populate("user", "name email phone")
    .populate("event", "title startsAt")
    .sort({ createdAt: -1 })
    .limit(500);
  res.json({ tickets });
};

exports.checkIn = async (req, res) => {
  const { ticketCode } = req.body;
  const ticket = await Ticket.findOne({ ticketCode });
  if (!ticket) return res.status(404).json({ message: "No ticket found with that code" });
  if (ticket.status === "checked_in") return res.status(400).json({ message: "Ticket already checked in", ticket });
  if (ticket.status !== "confirmed") return res.status(400).json({ message: `Ticket is ${ticket.status}, cannot check in`, ticket });

  ticket.status = "checked_in";
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = req.admin._id;
  await ticket.save();
  await logActivity(req, "checked_in_ticket", { ticketCode });
  res.json({ message: "Checked in", ticket });
};

// Used by the /#/manage/:token event-manager page - scoped so this link can only
// check in tickets that belong to its own event, never any other event.
exports.checkInByManagerToken = async (req, res) => {
  const { ticketCode } = req.body;
  const event = await Event.findOne({ managerToken: req.params.token });
  if (!event) return res.status(404).json({ message: "Invalid or expired manager link" });

  const ticket = await Ticket.findOne({ ticketCode, event: event._id });
  if (!ticket) return res.status(404).json({ message: "No ticket for this event with that code" });
  if (ticket.status === "checked_in") return res.status(400).json({ message: "Ticket already checked in", ticket });
  if (ticket.status !== "confirmed") return res.status(400).json({ message: `Ticket is ${ticket.status}, cannot check in`, ticket });

  ticket.status = "checked_in";
  ticket.checkedInAt = new Date();
  await ticket.save();
  res.json({ message: "Checked in", ticket });
};

exports.managerEventTickets = async (req, res) => {
  const event = await Event.findOne({ managerToken: req.params.token });
  if (!event) return res.status(404).json({ message: "Invalid or expired manager link" });
  const tickets = await Ticket.find({ event: event._id }).populate("user", "name email phone").sort({ createdAt: -1 });
  res.json({ tickets });
};

exports.refund = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  ticket.status = "refunded";
  await ticket.save();
  await logActivity(req, "refunded_ticket", { ticketId: ticket._id, ticketCode: ticket.ticketCode });
  res.json({ message: "Marked as refunded. Process the actual M-Pesa reversal from your Daraja/Safaricom portal.", ticket });
};
