const User = require("../models/User");
const OtpLog = require("../models/OtpLog");
const { generateOtpCode, hashOtp, signUserToken, isValidEmail } = require("../utils/helpers");
const { sendOtpEmail } = require("../utils/mailer");

const OTP_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);

async function issueOtp(email, purpose) {
  const code = generateOtpCode();
  await OtpLog.create({
    email,
    codeHash: hashOtp(code),
    purpose,
    expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
  });
  await sendOtpEmail(email, code, purpose);
}

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, campus } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a complete, correctly formatted email address" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const user = new User({ name, email: email.toLowerCase(), phone, campus });
    await user.setPassword(password);
    await user.save();

    await issueOtp(user.email, "signup");

    res.status(201).json({ message: "Account created. Check your email for a verification code.", email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong creating your account" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(404).json({ message: "No account found for that email" });
    await issueOtp(user.email, purpose || "signup");
    res.json({ message: "A new code has been sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not resend code" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, code, purpose } = req.body;
    const otp = await OtpLog.findOne({
      email: (email || "").toLowerCase(),
      purpose: purpose || "signup",
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otp) return res.status(400).json({ message: "No pending code found, request a new one" });
    if (otp.expiresAt < new Date()) return res.status(400).json({ message: "Code expired, request a new one" });
    if (otp.attempts >= 5) return res.status(429).json({ message: "Too many attempts, request a new code" });

    if (otp.codeHash !== hashOtp(code)) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ message: "Incorrect code" });
    }

    otp.consumedAt = new Date();
    await otp.save();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "Account not found" });

    if ((purpose || "signup") === "signup") {
      user.isVerified = true;
      await user.save();
    }

    const token = signUserToken(user);
    res.json({ message: "Verified", token, user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not verify code" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const valid = await user.comparePassword(password || "");
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.isActive) return res.status(403).json({ message: "This account has been disabled" });

    if (!user.isVerified) {
      await issueOtp(user.email, "login");
      return res.status(200).json({ requiresOtp: true, message: "Enter the verification code we just emailed you", email: user.email });
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    const token = signUserToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not log in" });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
};
