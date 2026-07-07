import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function Admins() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function load() {
    adminApi.get("/admin-auth/admins").then((res) => setAdmins(res.data.admins)).catch(() => {});
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      await adminApi.post("/admin-auth/admins", form);
      setInfo("Admin account created.");
      setForm({ name: "", email: "", password: "", role: "manager" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create admin");
    }
  }

  if (admin?.role !== "superadmin") {
    return (
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Admins</h1>
        <p style={{ color: "var(--ink-soft)" }}>Only superadmins can manage admin accounts.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Admins</h1>

      <form onSubmit={handleCreate} className="card" style={{ padding: 20, maxWidth: 420, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Add a new admin</h3>
        <div className="field">
          <label>Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Temporary password</label>
          <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="field">
          <label>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="manager">Manager</option>
            <option value="support">Support</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
        {error && <p className="error-text">{error}</p>}
        {info && <p style={{ color: "var(--success)", fontSize: 13 }}>{info}</p>}
        <button className="btn btn-gold" style={{ width: "100%" }}>Create admin</button>
      </form>

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Name", "Email", "Role", "Last login"].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td style={{ padding: "10px 14px" }}>{a.name}</td>
                <td style={{ padding: "10px 14px" }}>{a.email}</td>
                <td style={{ padding: "10px 14px" }}>{a.role}</td>
                <td style={{ padding: "10px 14px" }}>{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
