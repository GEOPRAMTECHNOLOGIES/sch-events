import { useEffect, useState } from "react";
import { api } from "../api/client";
import TicketStub from "../components/TicketStub";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/tickets/mine")
      .then((res) => setTickets(res.data.tickets))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 20 }}>My tickets</h1>
      {loading ? (
        <p>Loading&hellip;</p>
      ) : tickets.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>No tickets yet &mdash; go find something happening on campus.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {tickets.map((t) => (
            <TicketStub key={t._id} event={t.event} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
