import dayjs from "dayjs";

export default function TicketStub({ event, ticket, rightSlot }) {
  if (!event) return null;
  const isPast = dayjs(event.startsAt).isBefore(dayjs());
  const coverImage = event.coverImageUrl || event.gallery?.[0]?.url;

  return (
    <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 4, opacity: isPast ? 0.6 : 1 }}>
      {coverImage && (
        <img
          src={coverImage}
          alt=""
          loading="lazy"
          style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span className="pill pill-muted">{event.category || "Event"}</span>
          <h3 style={{ margin: "8px 0 4px", fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.25 }}>{event.title}</h3>
          <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 13 }}>
            {dayjs(event.startsAt).format("ddd, D MMM YYYY \u00b7 HH:mm")} &middot; {event.venue}
          </p>
        </div>
        {rightSlot}
      </div>

      {ticket && (
        <>
          <div className="perforation" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
