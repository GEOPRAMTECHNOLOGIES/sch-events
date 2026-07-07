import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function Leaderboard() {
  const [topEvents, setTopEvents] = useState([]);
  const [signups, setSignups] = useState([]);

  useEffect(() => {
    adminApi.get("/dashboard/top-events").then((res) => setTopEvents(res.data.events));
    adminApi.get("/dashboard/recent-signups").then((res) => setSignups(res.data.users));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Leaderboard &amp; signups</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: 14, color: "var(--ink-soft)" }}>Top events by revenue</h3>
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {topEvents.map((e) => (
              <li key={e.id} style={{ padding: "8px 0", borderBottom: "1px dashed var(--stub-line)" }}>
                <strong>{e.title}</strong>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>KSh {e.revenue.toLocaleString()} &middot; {e.ticketsSold} tickets</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: 14, color: "var(--ink-soft)" }}>Recent signups</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {signups.map((u) => (
              <li key={u._id} style={{ padding: "8px 0", borderBottom: "1px dashed var(--stub-line)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{u.name}</strong>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{u.email}</div>
                </div>
                <span className={`pill ${u.isVerified ? "pill-success" : "pill-muted"}`}>{u.isVerified ? "verified" : "pending"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
