const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { requireUser } = require("../middleware/auth");

const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: { message: "Too many attempts, try again later" } });

router.post("/register", ctrl.register);
router.post("/login", otpLimiter, ctrl.login);
router.post("/verify-otp", otpLimiter, ctrl.verifyOtp);
router.post("/resend-otp", otpLimiter, ctrl.resendOtp);
router.get("/me", requireUser, ctrl.me);

module.exports = router;
