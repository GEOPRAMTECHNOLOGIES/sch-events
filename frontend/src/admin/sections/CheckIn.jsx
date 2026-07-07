import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function CheckIn() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState([]);

  function load() {
    adminApi.get("/tickets/admin/all").then((res) => setTickets(res.data.tickets));
  }
  useEffect(load, []);

  async function handleCheckIn(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    try {
      const res = await adminApi.post("/tickets/admin/check-in", { ticketCode: code });
      setResult(res.data.ticket);
      setCode("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Check-in failed");
    }
  }

  async function handleRefund(id) {
    if (!window.confirm("Mark this ticket as refunded?")) return;
    await adminApi.post(`/tickets/admin/${id}/refund`);
    load();
  }

  async function handleResend(id) {
    const res = await adminApi.post(`/tickets/admin/${id}/resend-email`);
    alert(res.data.message);
    load();
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Check-in</h1>

      <form onSubmit={handleCheckIn} className="card" style={{ padding: 20, maxWidth: 420, marginBottom: 24 }}>
        <label>Ticket code or scanned QR value</label>
        <input className="mono" placeholder="CP-XXXXX-XXXX or the full QR text" value={code} onChange={(e) => setCode(e.target.value)} required />
        <p className="help-text" style={{ marginTop: 6 }}>
          Scan the guest's emailed QR with any phone scanner app and paste the result here, or type the ticket code printed under it.
        </p>
        <button className="btn btn-gold" style={{ width: "100%", marginTop: 12 }}>Check in</button>
        {error && <p className="error-text">{error}</p>}
        {result && <p style={{ color: "var(--success)", fontSize: 13, marginTop: 8 }}>Checked in: {result.tierName} ticket &mdash; {result.ticketCode}</p>}
      </form>

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Code", "User", "Event", "Tier", "Status", "Email", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.slice(0, 100).map((t) => (
              <tr key={t._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td className="mono" style={{ padding: "10px 14px" }}>{t.ticketCode}</td>
                <td style={{ padding: "10px 14px" }}>{t.user?.name}</td>
                <td style={{ padding: "10px 14px" }}>{t.event?.title}</td>
                <td style={{ padding: "10px 14px" }}>{t.tierName}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span className={`pill ${t.status === "confirmed" ? "pill-success" : t.status === "checked_in" ? "pill-gold" : "pill-muted"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span className={`pill ${t.emailStatus === "sent" ? "pill-success" : t.emailStatus === "failed" ? "pill-danger" : "pill-muted"}`}>
                    {t.emailStatus || "not sent"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
                  {t.status === "confirmed" && (
                    <button className="btn btn-danger" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleRefund(t._id)}>Refund</button>
                  )}
                  {t.emailStatus !== "sent" && (
                    <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleResend(t._id)}>Resend email</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
