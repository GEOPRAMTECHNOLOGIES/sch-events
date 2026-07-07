import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.requiresOtp) {
        navigate("/verify-otp", { state: { email, purpose: "login", from: location.state?.from } });
        return;
      }
      login(res.data.token, res.data.user);
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: "56px 24px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>Welcome back</h1>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginTop: 16 }}>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-gold" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Logging in\u2026" : "Log in"}
        </button>
        <p className="help-text" style={{ textAlign: "center", marginTop: 12 }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
