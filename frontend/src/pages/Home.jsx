import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useSiteSettings } from "../context/SiteSettingsContext";
import TicketStub from "../components/TicketStub";

export default function Home() {
  const { settings } = useSiteSettings();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events", { params: search ? { search } : {} })
      .then((res) => setEvents(res.data.events))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <section
        style={{
          background: "linear-gradient(135deg, var(--brand-dark), var(--brand))",
          color: "#fff",
          padding: "64px 0",
        }}
      >
        <div className="container">
          <span className="pill pill-gold">{events.length || 0} events open right now</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,5vw,52px)", margin: "16px 0 12px", maxWidth: 640 }}>
            {settings.heroTitle}
          </h1>
          <p style={{ color: "#dff2ea", maxWidth: 520, fontSize: 16 }}>{settings.heroSubtitle}</p>
          <div style={{ marginTop: 28, maxWidth: 420 }}>
            <input
              placeholder="Search events, e.g. 'Freshers Night'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "#fff" }}
            />
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "40px 24px" }}>
        {loading ? (
          <p>Loading events&hellip;</p>
        ) : events.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>No events match right now. Check back soon.</p>
        ) : (
          <div className="grid-responsive">
            {events.map((ev) => (
              <Link key={ev._id} to={`/event/${ev.slug || ev._id}`}>
                <TicketStub
                  event={ev}
                  rightSlot={
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {ev.tiers?.length ? `KSh ${Math.min(...ev.tiers.map((t) => t.price))}+` : "Free"}
                      </div>
                    </div>
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
