import dayjs from "dayjs";

export default function TicketStub({ event, ticket, rightSlot }) {
  if (!event) return null;
  const isPast = dayjs(event.startsAt).isBefore(dayjs());
  // Admin-inserted images: prefer the cover image, fall back to the first gallery photo.
  const coverImage = event.coverImageUrl || event.gallery?.[0]?.url;
  const extraShots = (event.gallery || []).filter((g) => g.url !== coverImage).slice(0, 3);

  return (
    <div className="ticket-card" style={{ opacity: isPast ? 0.6 : 1 }}>
      {coverImage ? (
        <div style={{ position: "relative" }}>
          <img className="ticket-card__media" src={coverImage} alt="" loading="lazy" />
          <span
            className="pill pill-gold"
            style={{ position: "absolute", top: 12, left: 12, boxShadow: "0 4px 10px rgba(0,0,0,0.25)" }}
          >
            {event.category || "Event"}
          </span>
          {extraShots.length > 0 && (
            <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 4 }}>
              {extraShots.map((g, i) => (
                <img
                  key={i}
                  src={g.url}
                  alt=""
                  loading="lazy"
                  style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="ticket-card__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            {!coverImage && <span className="pill pill-muted">{event.category || "Event"}</span>}
            <h3 style={{ margin: coverImage ? 0 : "8px 0 4px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, lineHeight: 1.25 }}>
              {event.title}
            </h3>
            <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: 13 }}>
              {dayjs(event.startsAt).format("ddd, D MMM YYYY \u00b7 HH:mm")} &middot; {event.venue}
            </p>
          </div>
          {rightSlot}
        </div>
      </div>

      {ticket && (
        <>
          <div className="ticket-card__seam" />
          <div className="ticket-card__stub">
            <div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{ticket.ticketCode}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{ticket.tierName}</div>
            </div>
            <span
              className={`pill ${
                ticket.status === "confirmed"
                  ? "pill-success"
                  : ticket.status === "checked_in"
                  ? "pill-gold"
                  : ticket.status === "pending_payment"
                  ? "pill-muted"
                  : "pill-danger"
              }`}
            >
              {ticket.status.replace("_", " ")}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
