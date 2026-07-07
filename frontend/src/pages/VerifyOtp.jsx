import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;
  const purpose = location.state?.purpose || "signup";
  const from = location.state?.from;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <div className="container" style={{ padding: 40 }}>
        <p>No verification pending. Go back to <a href="/login">login</a>.</p>
      </div>
    );
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, code, purpose });
      login(res.data.token, res.data.user);
      navigate(from || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      await api.post("/auth/resend-otp", { email, purpose });
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: "56px 24px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>Check your email</h1>
      <p className="help-text">We sent a 6-digit code to {email}.</p>
      <form onSubmit={handleVerify} className="card" style={{ padding: 24, marginTop: 16 }}>
        <div className="field">
          <label>Verification code</label>
          <input
            className="mono"
            style={{ fontSize: 22, letterSpacing: 6, textAlign: "center" }}
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        {info && <p className="help-text">{info}</p>}
        <button className="btn btn-gold" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Verifying\u2026" : "Verify"}
        </button>
        <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={handleResend}>
          Resend code
        </button>
      </form>
    </div>
  );
}
