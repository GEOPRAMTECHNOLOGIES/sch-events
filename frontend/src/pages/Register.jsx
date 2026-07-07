import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", campus: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/verify-otp", { state: { email: form.email, purpose: "signup" } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: "56px 24px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>Create your account</h1>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginTop: 16 }}>
        <div className="field">
          <label>Full name</label>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input required placeholder="07XX XXX XXX" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="field">
          <label>Campus (optional)</label>
          <input value={form.campus} onChange={(e) => update("campus", e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-gold" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Creating account\u2026" : "Sign up"}
        </button>
        <p className="help-text" style={{ textAlign: "center", marginTop: 12 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
