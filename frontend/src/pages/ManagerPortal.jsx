import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ManagerPortal() {
  const { token } = useParams();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [checkInMsg, setCheckInMsg] = useState("");
  const [checkInErr, setCheckInErr] = useState("");

  function load() {
    axios
      .get(`${API_URL}/events/manager/${token}`)
      .then((res) => setEvent(res.data.event))
      .catch(() => setError("This link is invalid or has expired."));

    axios
      .get(`${API_URL}/tickets/manager/${token}`)
      .then((res) => setTickets(res.data.tickets))
      .catch(() => {});
  }

  useEffect(load, [token]);

  async function handleCheckIn(e) {
    e.preventDefault();
    setCheckInErr("");
    setCheckInMsg("");
    try {
      const res = await axios.post(`${API_URL}/tickets/manager/${token}/check-in`, { ticketCode: code });
      setCheckInMsg(`Checked in: ${res.data.ticket.tierName} ticket`);
      setCode("");
      load();
    } catch (err) {
      setCheckInErr(err.response?.data?.message || "Check-in failed");
    }
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: "var(--stamp)" }}>{error}</p>
      </div>
    );
  }

  if (!event) return <div className="container" style={{ padding: 40 }}>Loading&hellip;</div>;

  const confirmedCount = tickets.filter((t) => t.status === "confirmed" || t.status === "checked_in").length;
  const checkedInCount = tickets.filter((t) => t.status === "checked_in").length;

  return (
    <div className="container" style={{ padding: "40px 24px", maxWidth: 720 }}>
      <span className="pill pill-gold">event manager view</span>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "12px 0 4px" }}>{event.title}</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        {dayjs(event.startsAt).format("dddd, D MMMM YYYY \u00b7 HH:mm")} &middot; {event.venue}
      </p>

      <div style={{ display: "flex", gap: 14, margin: "20px 0" }}>
        <div className="card" style={{ padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Tickets sold</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>{confirmedCount}</div>
        </div>
        <div className="card" style={{ padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Checked in</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>{checkedInCount}</div>
        </div>
      </div>

      <form onSubmit={handleCheckIn} className="card" style={{ padding: 20, marginBottom: 20 }}>
        <label>Ticket code</label>
        <input className="mono" placeholder="CP-XXXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button className="btn btn-gold" style={{ width: "100%", marginTop: 12 }}>Check in</button>
        {checkInErr && <p className="error-text">{checkInErr}</p>}
        {checkInMsg && <p style={{ color: "var(--success)", fontSize: 13, marginTop: 8 }}>{checkInMsg}</p>}
      </form>

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Code", "Attendee", "Tier", "Status"].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td className="mono" style={{ padding: "10px 14px" }}>{t.ticketCode}</td>
                <td style={{ padding: "10px 14px" }}>{t.user?.name}</td>
                <td style={{ padding: "10px 14px" }}>{t.tierName}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span className={`pill ${t.status === "confirmed" ? "pill-success" : t.status === "checked_in" ? "pill-gold" : "pill-muted"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="help-text" style={{ marginTop: 16 }}>
        This link only shows this one event and doesn't require a login &mdash; keep it private.
      </p>
    </div>
  );
}
