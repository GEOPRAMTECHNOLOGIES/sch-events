import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { adminApi } from "../../api/client";
import StatCard from "../StatCard";

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [staleEvents, setStaleEvents] = useState([]);

  useEffect(() => {
    adminApi.get("/dashboard/overview").then((res) => setStats(res.data));
    adminApi.get("/dashboard/revenue-timeseries").then((res) => setSeries(res.data.series));
    adminApi.get("/dashboard/recent-transactions").then((res) => setRecentTx(res.data.transactions));
    adminApi.get("/dashboard/stale-events").then((res) => setStaleEvents(res.data.events));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Overview</h1>

      {staleEvents.length > 0 && (
        <div className="card" style={{ padding: "14px 18px", marginBottom: 18, borderLeft: "4px solid var(--stamp)" }}>
          <strong style={{ fontSize: 13 }}>{staleEvents.length} event{staleEvents.length > 1 ? "s" : ""} ended over a month ago:</strong>{" "}
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{staleEvents.map((e) => e.title).join(", ")}. Head to Events to delete if no longer needed.</span>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total revenue" value={stats ? `KSh ${stats.totalRevenue.toLocaleString()}` : "\u2026"} accent="var(--gold-deep)" />
        <StatCard label="Tickets sold" value={stats?.totalTicketsSold ?? "\u2026"} />
        <StatCard label="Registered users" value={stats?.totalUsers ?? "\u2026"} />
        <StatCard label="Active events" value={stats?.activeEvents ?? "\u2026"} />
        <StatCard label="Users online now" value={stats?.usersOnlineNow ?? "\u2026"} hint="last 15 minutes" />
        <StatCard label="Failed payments (24h)" value={stats?.failedPayments24h ?? "\u2026"} accent="var(--stamp)" />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-soft)" }}>
          Revenue &mdash; last 14 days
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => `KSh ${v}`} />
            <Line type="monotone" dataKey="revenue" stroke="#d9a520" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3 style={{ marginTop: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-soft)" }}>
          Recent transactions
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--stub-line)" }}>
              {["Date", "User", "Event", "Amount", "Status"].map((h) => (
                <th key={h} style={{ padding: "8px 10px", color: "var(--ink-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTx.map((t) => (
              <tr key={t._id} style={{ borderBottom: "1px dashed var(--stub-line)" }}>
                <td style={{ padding: "8px 10px" }}>{new Date(t.createdAt).toLocaleString()}</td>
                <td style={{ padding: "8px 10px" }}>{t.user?.name}</td>
                <td style={{ padding: "8px 10px" }}>{t.event?.title}</td>
                <td style={{ padding: "8px 10px" }}>KSh {t.amount}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span className={`pill ${t.status === "success" ? "pill-success" : t.status === "failed" || t.status === "cancelled" ? "pill-danger" : "pill-muted"}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
