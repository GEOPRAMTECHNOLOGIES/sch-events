import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export default function EventDetail() {
  const { idOrSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [tierId, setTierId] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // idle | paying | success | error
  const [message, setMessage] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    const request = OBJECT_ID_RE.test(idOrSlug) ? api.get(`/events/${idOrSlug}`) : api.get(`/events/slug/${idOrSlug}`);
    request
      .then((res) => {
        setEvent(res.data.event);
        setTierId(res.data.event.tiers?.[0]?._id || "");
      })
      .catch(() => setNotFound(true));
    return () => clearInterval(pollRef.current);
  }, [idOrSlug]);

  if (notFound) return <div className="container" style={{ padding: 40 }}>That event couldn't be found.</div>;
  if (!event) return <div className="container" style={{ padding: 40 }}>Loading&hellip;</div>;

  const tier = event.tiers.find((t) => t._id === tierId);
  const images = [
    ...(event.coverImageUrl ? [{ url: event.coverImageUrl, caption: "" }] : []),
    ...(event.gallery || []),
  ];
  const accent = event.themeColor || undefined;

  async function handleBook(e) {
    e.preventDefault();
    if (!user) return navigate("/login", { state: { from: `/events/${event._id}` } });
    setStatus("paying");
    setMessage("");
    try {
      const res = await api.post("/tickets/book", { eventId: event._id, tierId, phone });
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
    <div className="container" style={{ padding: "40px 24px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
      <div>
        {images.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <img
              src={images[activeImage]?.url}
              alt={images[activeImage]?.caption || event.title}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
            />
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt=""
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: 76,
                      height: 52,
                      objectFit: "cover",
                      borderRadius: 10,
                      cursor: "pointer",
                      opacity: i === activeImage ? 1 : 0.6,
                      border: i === activeImage ? `2px solid ${accent || "var(--spark-deep)"}` : "2px solid transparent",
                      transition: "opacity 0.15s ease",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <span className="pill pill-muted" style={accent ? { background: accent, color: "#fff" } : undefined}>
          {event.category}
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: "12px 0" }}>{event.title}</h1>
        <p style={{ color: "var(--ink-soft)" }}>
          {dayjs(event.startsAt).format("dddd, D MMMM YYYY \u00b7 HH:mm")} &middot; {event.venue}
        </p>
        <p style={{ lineHeight: 1.6, marginTop: 16 }}>{event.description}</p>

        {event.externalLink && (
          <a
            href={event.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ marginTop: 12, display: "inline-flex" }}
          >
            More about this event &rarr;
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

        <button
          className="btn btn-gold"
          style={{ width: "100%", ...(accent ? { background: accent, color: "#fff" } : {}) }}
          onClick={handleBook}
          disabled={status === "paying"}
        >
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
