import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tierId, setTierId] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // idle | paying | success | error
  const [message, setMessage] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    api.get(`/events/${id}`).then((res) => {
      setEvent(res.data.event);
      setTierId(res.data.event.tiers?.[0]?._id || "");
    });
    return () => clearInterval(pollRef.current);
  }, [id]);

  if (!event) return <div className="container" style={{ padding: 40 }}>Loading&hellip;</div>;

  // An event can override the app's brand color with its own theme color.
  const themeVars = event.themeColor ? { "--brand": event.themeColor } : undefined;
  const gallery = event.images?.length ? event.images : event.coverImageUrl ? [event.coverImageUrl] : [];

  const tier = event.tiers.find((t) => t._id === tierId);

  async function handleBook(e) {
    e.preventDefault();
    if (!user) return navigate("/login", { state: { from: `/events/${id}` } });
    setStatus("paying");
    setMessage("");
    try {
      const res = await api.post("/tickets/book", { eventId: id, tierId, phone });
      if (res.data.free) {
        setStatus("success");
        setMessage("Ticket confirmed! Check your email for your QR ticket.");
        return;
      }
      setMessage(res.data.message);
      const checkoutRequestId = res.data.checkoutRequestId;
      pollRef.current = setInterval(async () => {
        const s = await api.get(`/tickets/status/${checkoutRequestId}`);
        if (s.data.status === "success") {
          clearInterval(pollRef.current);
          setStatus("success");
          setMessage("Payment received! Your ticket is on its way to your email.");
        } else if (s.data.status === "failed" || s.data.status === "cancelled") {
          clearInterval(pollRef.current);
          setStatus("error");
          setMessage("Payment was not completed. You can try again.");
        }
      }, 4000);
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Could not start payment");
    }
  }

  return (
    <div
      className="container event-detail-grid"
      style={{ padding: "40px 24px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, ...themeVars }}
    >
      <div>
        {gallery.length > 0 && (
          <div className={gallery.length > 1 ? "responsive-gallery" : ""} style={{ marginBottom: 20 }}>
            {gallery.length === 1 ? (
              <img
                src={gallery[0]}
                alt={event.title}
                style={{ width: "100%", maxHeight: 340, objectFit: "cover", borderRadius: 12 }}
              />
            ) : (
              gallery.map((src, i) => <img key={i} src={src} alt={`${event.title} ${i + 1}`} />)
            )}
          </div>
        )}

        <span className="pill pill-brand">{event.category}</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: "12px 0" }}>{event.title}</h1>
        <p style={{ color: "var(--ink-soft)" }}>
          {dayjs(event.startsAt).format("dddd, D MMMM YYYY \u00b7 HH:mm")} &middot; {event.venue}
        </p>
        <p style={{ lineHeight: 1.6, marginTop: 16 }}>{event.description}</p>

        {event.externalLink && (
          <a
            href={event.externalLink}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ marginTop: 8, display: "inline-flex" }}
          >
            More details &#8599;
          </a>
        )}
      </div>

      <div className="card" style={{ padding: 24, height: "fit-content" }}>
        <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: 16 }}>Get your ticket</h3>

        <div className="field">
          <label>Ticket type</label>
          <select value={tierId} onChange={(e) => setTierId(e.target.value)}>
            {event.tiers.map((t) => (
              <option key={t._id} value={t._id} disabled={t.quantitySold >= t.quantityTotal}>
                {t.name} &mdash; {t.price === 0 ? "Free" : `KSh ${t.price}`} {t.quantitySold >= t.quantityTotal ? "(sold out)" : ""}
              </option>
            ))}
          </select>
        </div>

        {tier && tier.price > 0 && (
          <div className="field">
            <label>M-Pesa phone number</label>
            <input placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <p className="help-text">You'll get an STK push prompt on this number.</p>
          </div>
        )}

        <button className="btn btn-gold" style={{ width: "100%" }} onClick={handleBook} disabled={status === "paying"}>
          {status === "paying" ? "Waiting for payment\u2026" : tier?.price === 0 ? "Reserve free ticket" : `Pay KSh ${tier?.price || 0}`}
        </button>

        {message && (
          <p style={{ marginTop: 12, color: status === "error" ? "var(--stamp)" : "var(--ink-soft)", fontSize: 13 }}>{message}</p>
        )}
        {status === "success" && (
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => navigate("/my-tickets")}>
            View my tickets
          </button>
        )}
      </div>
    </div>
  );
}
