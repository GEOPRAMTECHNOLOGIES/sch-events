const axios = require("axios");

function baseUrl() {
  return process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function timestampNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// normalizes 07xxxxxxxx / +2547xxxxxxxx / 2547xxxxxxxx to 2547xxxxxxxx
function normalizeMsisdn(phone) {
  let p = String(phone).replace(/\s|-/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7") || p.startsWith("1")) p = "254" + p;
  return p;
}

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const { data } = await axios.get(
    `${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
}

/**
 * Initiates an STK push ("Lipa Na M-Pesa Online") prompt on the customer's phone.
 * PartyA = customer phone, PartyB = your till/paybill shortcode (MPESA_PARTYB).
 */
async function initiateStkPush({ phone, amount, accountReference, transactionDesc }) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const partyB = process.env.MPESA_PARTYB || shortcode;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = timestampNow();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const msisdn = normalizeMsisdn(phone);

  const token = await getAccessToken();

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerBuyGoodsOnline",
    Amount: Math.round(amount),
    PartyA: msisdn,
    PartyB: partyB,
    PhoneNumber: msisdn,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountReference || "CampusPass",
    TransactionDesc: transactionDesc || "Event ticket payment",
  };

  const { data } = await axios.post(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data; // contains MerchantRequestID, CheckoutRequestID, ResponseCode, etc.
}

async function stkPushQuery(checkoutRequestId) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = timestampNow();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const token = await getAccessToken();

  const { data } = await axios.post(
    `${baseUrl()}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}

module.exports = { initiateStkPush, stkPushQuery, normalizeMsisdn };
