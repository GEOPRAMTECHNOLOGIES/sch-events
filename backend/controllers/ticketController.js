const QRCode = require("qrcode");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");
const { initiateStkPush } = require("../utils/mpesa");
const {
  generateTicketCode,
  isValidEmail,
  buildQrPayload,
  verifyQrPayload,
  ticketEmailPayloadIsComplete,
} = require("../utils/helpers");
const { sendTicketConfirmationEmail } = require("../utils/mailer");
const logActivity = require("../middleware/logActivity");

// Managers only ever see/act on the single event assigned to them.
function eventScopeFilter(admin) {
  if (admin.role === "manager") return { event: admin.managedEvent };
  return {};
}

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
  const User = require("../models/User");
  try {
    const user = await User.findById(ticket.user);

    // Guard #1: the recipient email itself must be a valid, complete address.
    if (!user || !isValidEmail(user.email)) {
      ticket.emailStatus = "failed";
      ticket.emailError = "Recipient email is missing or invalid";
      await ticket.save();
      console.error(`[email] ticket ${ticket.ticketCode}: invalid/missing recipient email`);
      return;
    }

    // QR encodes ticketCode + a signature, so a manager's check-in scan can be
    // verified as genuinely issued by us, not just a guessed/typo'd code.
    const qrDataUrl = await QRCode.toDataURL(buildQrPayload(ticket.ticketCode), {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 320,
    });

    const payload = {
      to: user.email,
      eventTitle: event.title,
      tierName: ticket.tierName,
      ticketCode: ticket.ticketCode,
      venue: event.venue,
      startsAt: event.startsAt,
      qrDataUrl,
    };

    // Guard #2: every field the email template needs must be present and well-formed
    // before we attempt to send - never mail out a half-complete confirmation.
    if (!ticketEmailPayloadIsComplete(payload)) {
      ticket.emailStatus = "failed";
      ticket.emailError = "Ticket/event data was incomplete, email withheld";
      await ticket.save();
      console.error(`[email] ticket ${ticket.ticketCode}: incomplete payload, email withheld`);
      return;
    }

    await sendTicketConfirmationEmail(payload.to, payload);
    ticket.emailStatus = "sent";
    ticket.emailSentAt = new Date();
    ticket.emailError = "";
    await ticket.save();
  } catch (err) {
    console.error("[email] ticket confirmation failed:", err.message);
    try {
      ticket.emailStatus = "failed";
      ticket.emailError = err.message?.slice(0, 300) || "Unknown error";
      await ticket.save();
    } catch (_) {
      /* ignore secondary failure */
    }
  }
}

// Admin/manager action: retry sending a ticket's confirmation email, e.g.
// after the user fixes a typo'd address or a transient SMTP failure.
exports.resendTicketEmail = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (req.admin.role === "manager" && String(ticket.event) !== String(req.admin.managedEvent)) {
    return res.status(403).json({ message: "You can only manage tickets for your assigned event" });
  }
  const event = await Event.findById(ticket.event);
  await deliverTicketEmail(ticket, event);
  await logActivity(req, "resent_ticket_email", { ticketCode: ticket.ticketCode, status: ticket.emailStatus });
  res.json({ message: ticket.emailStatus === "sent" ? "Email sent" : "Email could not be sent", ticket });
};

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
  const filter = eventScopeFilter(req.admin);
  const tickets = await Ticket.find(filter)
    .populate("user", "name email phone")
    .populate("event", "title startsAt")
    .sort({ createdAt: -1 })
    .limit(500);
  res.json({ tickets });
};

// Managers can only validate QR/ticket codes for the single event assigned to them.
exports.checkIn = async (req, res) => {
  const { ticketCode } = req.body;
  if (!ticketCode) return res.status(400).json({ message: "Ticket or QR code is required" });

  // Accept either a raw ticket code (typed in manually) or the signed QR
  // payload "CODE.SIGNATURE" produced by the emailed QR - reject a payload
  // whose signature doesn't match (tampered / forged code).
  const resolvedCode = verifyQrPayload(ticketCode.trim());
  if (resolvedCode === null) {
    return res.status(400).json({ message: "This QR code failed verification and cannot be trusted" });
  }

  const ticket = await Ticket.findOne({ ticketCode: resolvedCode });
  if (!ticket) return res.status(404).json({ message: "No ticket found with that code" });

  if (req.admin.role === "manager" && String(ticket.event) !== String(req.admin.managedEvent)) {
    return res.status(403).json({ message: "This ticket belongs to a different event than the one you manage" });
  }

  if (ticket.status === "checked_in") return res.status(400).json({ message: "Ticket already checked in", ticket });
  if (ticket.status !== "confirmed") return res.status(400).json({ message: `Ticket is ${ticket.status}, cannot check in`, ticket });

  ticket.status = "checked_in";
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = req.admin._id;
  await ticket.save();
  await logActivity(req, "checked_in_ticket", { ticketCode: resolvedCode });
  res.json({ message: "Checked in", ticket });
};

exports.refund = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (req.admin.role === "manager" && String(ticket.event) !== String(req.admin.managedEvent)) {
    return res.status(403).json({ message: "You can only manage tickets for your assigned event" });
  }
  ticket.status = "refunded";
  await ticket.save();
  await logActivity(req, "refunded_ticket", { ticketId: ticket._id, ticketCode: ticket.ticketCode });
  res.json({ message: "Marked as refunded. Process the actual M-Pesa reversal from your Daraja/Safaricom portal.", ticket });
};
