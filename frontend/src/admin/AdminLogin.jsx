import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, ADMIN_ROUTE_SLUG } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.post("/admin-auth/login", { email, password });
      login(res.data.token, res.data.admin);
      navigate(`/${ADMIN_ROUTE_SLUG}`);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 32, width: 360 }}>
        <span className="pill pill-gold">restricted access</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: "12px 0 20px" }}>Admin console</h1>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Signing in\u2026" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
