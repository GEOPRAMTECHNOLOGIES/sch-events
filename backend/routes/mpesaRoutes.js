const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/ticketController");

// This is the public URL you must put in MPESA_CALLBACK_URL and register
// on the Safaricom Daraja portal for your shortcode.
router.post("/callback", ctrl.mpesaCallback);

module.exports = router;
