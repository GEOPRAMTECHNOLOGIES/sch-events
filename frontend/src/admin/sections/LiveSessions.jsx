import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function LiveSessions() {
  const [users, setUsers] = useState([]);

  function load() {
    adminApi.get("/dashboard/active-sessions").then((res) => setUsers(res.data.users));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Live sessions</h1>
      <p className="help-text" style={{ marginBottom: 16 }}>Users seen in the last 15 minutes &mdash; refreshes automatically.</p>
      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Name", "Email", "Last seen", "IP"].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 14, color: "var(--ink-soft)" }}>No one active right now.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                  <td style={{ padding: "10px 14px" }}>{u.name}</td>
                  <td style={{ padding: "10px 14px" }}>{u.email}</td>
                  <td style={{ padding: "10px 14px" }}>{new Date(u.lastLoginAt).toLocaleTimeString()}</td>
                  <td className="mono" style={{ padding: "10px 14px" }}>{u.lastLoginIp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
