import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { adminApi } from "../../api/client";
import StatCard from "../StatCard";

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    adminApi.get("/dashboard/overview").then((res) => setStats(res.data));
    adminApi.get("/dashboard/revenue-timeseries").then((res) => setSeries(res.data.series));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Overview</h1>

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
    </div>
  );
}
