import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import TicketStub from "../components/TicketStub";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings();

  useEffect(() => {
    api
      .get("/events", { params: search ? { search } : {} })
      .then((res) => setEvents(res.data.events))
      .finally(() => setLoading(false));
  }, [search]);

  const featured = events.find((e) => e.isFeatured) || events[0];
  const featuredImage = featured?.coverImageUrl || featured?.gallery?.[0]?.url;

  return (
    <div>
      <section style={{ background: "var(--gradient-brand)", color: "#fff", padding: "72px 0 88px", position: "relative", overflow: "hidden" }}>
        <div
          className="container"
          style={{ display: "grid", gridTemplateColumns: featuredImage ? "1.2fr 1fr" : "1fr", gap: 40, alignItems: "center", position: "relative", zIndex: 1 }}
        >
          <div>
            <span className="pill pill-gold">{events.length || 0} events open right now</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(34px,5vw,54px)", margin: "18px 0 12px", maxWidth: 620, lineHeight: 1.05 }}>
              {settings.heroTitle}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.82)", maxWidth: 500, fontSize: 16, lineHeight: 1.5 }}>
              {settings.heroSubtitle}
            </p>
            <div style={{ marginTop: 28, maxWidth: 420 }}>
              <input
                placeholder="Search events, e.g. 'Freshers Night'"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: "#fff" }}
              />
            </div>
          </div>

          {featuredImage && (
            <div style={{ position: "relative", justifySelf: "center" }}>
              <img
                src={featuredImage}
                alt={featured.title}
                style={{
                  width: "100%",
                  maxWidth: 340,
                  aspectRatio: "4 / 5",
                  objectFit: "cover",
                  borderRadius: 24,
                  boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)",
                  transform: "rotate(3deg)",
                  border: "6px solid rgba(255,255,255,0.15)",
                }}
              />
              <div
                className="card"
                style={{
                  position: "absolute",
                  bottom: -18,
                  left: -18,
                  padding: "10px 16px",
                  transform: "rotate(-4deg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span className="pill pill-success">Now open</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--forest)" }}>{featured.title}</span>
              </div>
            </div>
          )}
        </div>
        {/* ambient gradient blobs, purely decorative */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(242,183,5,0.25)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(50px)" }} />
      </section>

      <section className="container" style={{ padding: "40px 24px" }}>
        {loading ? (
          <p>Loading events&hellip;</p>
        ) : events.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>No events match right now. Check back soon.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
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
