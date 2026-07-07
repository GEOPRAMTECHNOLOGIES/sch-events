import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function Notifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  function load() {
    adminApi.get("/notifications/admin/all").then((res) => setHistory(res.data.notifications));
  }
  useEffect(load, []);

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    try {
      await adminApi.post("/notifications/admin/send", { title, message, audience: "all_users", channel });
      setTitle("");
      setMessage("");
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Notifications</h1>

      <form onSubmit={handleSend} className="card" style={{ padding: 20, maxWidth: 480, marginBottom: 24 }}>
        <div className="field">
          <label>Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea rows={3} required value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="field">
          <label>Channel</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="in_app">In-app only</option>
            <option value="email">Email only</option>
            <option value="both">In-app + email</option>
          </select>
        </div>
        <button className="btn btn-gold" disabled={sending}>{sending ? "Sending\u2026" : "Send to all users"}</button>
      </form>

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Sent", "Title", "Channel", "Audience"].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((n) => (
              <tr key={n._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td style={{ padding: "10px 14px" }}>{new Date(n.createdAt).toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>{n.title}</td>
                <td style={{ padding: "10px 14px" }}>{n.channel}</td>
                <td style={{ padding: "10px 14px" }}>{n.audience}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
