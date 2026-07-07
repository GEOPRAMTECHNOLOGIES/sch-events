import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { adminApi } from "../../api/client";

const COLORS = ["#1b2a4a", "#f2c14e", "#c0392b", "#2f9461", "#445074"];

export default function Analytics() {
  const [byEvent, setByEvent] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    adminApi.get("/dashboard/tickets-by-event").then((res) => setByEvent(res.data.series));
    adminApi.get("/dashboard/payment-breakdown").then((res) => setPayments(res.data.series));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Analytics &amp; graphs</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: 14, color: "var(--ink-soft)" }}>Tickets sold by event (top 10)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byEvent} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="event" width={140} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#1b2a4a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: 14, color: "var(--ink-soft)" }}>Payment status breakdown</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={payments} dataKey="count" nameKey="status" outerRadius={100} label>
                {payments.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
