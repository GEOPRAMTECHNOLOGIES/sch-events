const nodemailer = require("nodemailer");

function buildTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail "App Password", NOT the normal account password
    },
  });
}

const brand = {
  name: process.env.MAIL_FROM_NAME || "CampusPass",
  accent: "#F2C14E",
  ink: "#1B2A4A",
  paper: "#FBF7EE",
};

function wrapLayout(bodyHtml, heading) {
  return `
  <div style="background:${brand.paper};padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e0cf;border-radius:10px;overflow:hidden;">
      <div style="background:${brand.ink};padding:20px 28px;">
        <span style="color:${brand.accent};font-size:20px;font-weight:800;letter-spacing:0.5px;">${brand.name}</span>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 16px;color:${brand.ink};font-size:18px;">${heading}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;background:#f5f1e6;color:#8a8060;font-size:12px;">
        This is an automated message from ${brand.name}. If you didn't request this, you can ignore it.
      </div>
    </div>
  </div>`;
}

async function sendMail({ to, subject, html }) {
  const transporter = buildTransport();
  await transporter.sendMail({
    from: `"${brand.name}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendOtpEmail(to, code, purpose = "signup") {
  const purposeCopy = {
    signup: "Confirm your email to finish creating your account.",
    login: "Use this code to finish signing in.",
    reset_password: "Use this code to reset your password.",
  }[purpose];

  const html = wrapLayout(
    `<p style="color:#444;font-size:14px;">${purposeCopy}</p>
     <div style="margin:20px 0;text-align:center;">
       <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:800;color:${brand.ink};background:${brand.accent};padding:12px 20px;border-radius:8px;">${code}</span>
     </div>
     <p style="color:#888;font-size:12px;">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>`,
    "Your verification code"
  );

  await sendMail({ to, subject: `${code} is your ${brand.name} verification code`, html });
}

async function sendTicketConfirmationEmail(to, { eventTitle, tierName, ticketCode, venue, startsAt, qrDataUrl }) {
  // Every field below is required for the ticket to be useful at the gate, so we never
  // send this email with a blank/undefined value - fall back to a safe placeholder instead
  // of silently omitting something, since a partially-blank ticket email is worse than none.
  const safe = (v, fallback = "TBA") => (v === undefined || v === null || v === "" ? fallback : v);

  const html = wrapLayout(
    `<p style="color:#444;font-size:14px;">Your ticket for <strong>${safe(eventTitle)}</strong> is confirmed. See you there!</p>
     <table style="width:100%;font-size:14px;color:#333;margin:16px 0;">
       <tr><td style="padding:4px 0;color:#888;">Ticket type</td><td style="text-align:right;font-weight:600;">${safe(tierName)}</td></tr>
       <tr><td style="padding:4px 0;color:#888;">Venue</td><td style="text-align:right;font-weight:600;">${safe(venue)}</td></tr>
       <tr><td style="padding:4px 0;color:#888;">Date</td><td style="text-align:right;font-weight:600;">${startsAt ? new Date(startsAt).toLocaleString() : "TBA"}</td></tr>
       <tr><td style="padding:4px 0;color:#888;">Ticket code</td><td style="text-align:right;font-weight:700;font-family:monospace;font-size:15px;">${safe(ticketCode)}</td></tr>
     </table>
     ${
       qrDataUrl
         ? `<div style="text-align:center;margin:16px 0;">
              <img src="${qrDataUrl}" alt="QR code for ticket ${safe(ticketCode)}" width="200" height="200" style="width:200px;height:200px;border:8px solid #fff;background:#fff;" />
            </div>`
         : ""
     }
     <p style="color:#888;font-size:12px;text-align:center;">
       Show the QR code above at the entrance for check-in. If it doesn't load in your inbox, the ticket code
       <strong>${safe(ticketCode)}</strong> above works on its own &mdash; just show or read that out at the gate.
     </p>`,
    "Ticket confirmed \u2705"
  );

  await sendMail({ to, subject: `Your ticket for ${safe(eventTitle, "your event")}`, html });
}

async function sendNotificationEmail(to, { title, message }) {
  const html = wrapLayout(`<p style="color:#444;font-size:14px;">${message}</p>`, title);
  await sendMail({ to, subject: title, html });
}

module.exports = { sendMail, sendOtpEmail, sendTicketConfirmationEmail, sendNotificationEmail };
