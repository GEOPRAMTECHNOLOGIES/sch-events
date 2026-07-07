import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [cleanupMsg, setCleanupMsg] = useState("");

  // 7 independent filters: status, event, date-from, date-to, search (phone/receipt), min amount, max amount
  const [filters, setFilters] = useState({ status: "", eventId: "", dateFrom: "", dateTo: "", search: "", minAmount: "", maxAmount: "" });

  useEffect(() => {
    adminApi.get("/events/admin/all").then((res) => setEvents(res.data.events));
  }, []);

  useEffect(() => {
    const params = { page };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    adminApi.get("/dashboard/transactions", { params }).then((res) => {
      setTransactions(res.data.transactions);
      setPages(res.data.pages);
    });
  }, [filters, page]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function downloadCsv() {
    const res = await adminApi.get("/dashboard/transactions/export.csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  }

  async function handleCleanup() {
    if (!window.confirm("Delete all non-successful transactions older than 14 days? This can't be undone.")) return;
    const res = await adminApi.delete("/dashboard/transactions/cleanup");
    setCleanupMsg(res.data.message);
    setPage(1);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Transactions</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-danger" onClick={handleCleanup}>Delete old failed (14d+)</button>
          <button className="btn btn-primary" onClick={downloadCsv}>Export CSV</button>
        </div>
      </div>

      {cleanupMsg && <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 12 }}>{cleanupMsg}</p>}

      <div className="card" style={{ padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <div>
          <label>Status</label>
          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="initiated">Initiated</option>
          </select>
        </div>
        <div>
          <label>Event</label>
          <select value={filters.eventId} onChange={(e) => updateFilter("eventId", e.target.value)}>
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label>From date</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => updateFilter("dateFrom", e.target.value)} />
        </div>
        <div>
          <label>To date</label>
          <input type="date" value={filters.dateTo} onChange={(e) => updateFilter("dateTo", e.target.value)} />
        </div>
        <div>
          <label>Min amount</label>
          <input type="number" min="0" value={filters.minAmount} onChange={(e) => updateFilter("minAmount", e.target.value)} />
        </div>
        <div>
          <label>Max amount</label>
          <input type="number" min="0" value={filters.maxAmount} onChange={(e) => updateFilter("maxAmount", e.target.value)} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label>Search (phone or M-Pesa receipt)</label>
          <input value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="07XX... or receipt code" />
        </div>
      </div>

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Date", "User", "Event", "Amount", "Phone", "M-Pesa receipt", "Status"].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td style={{ padding: "10px 14px" }}>{new Date(t.createdAt).toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>{t.user?.name}</td>
                <td style={{ padding: "10px 14px" }}>{t.event?.title}</td>
                <td style={{ padding: "10px 14px" }}>KSh {t.amount}</td>
                <td style={{ padding: "10px 14px" }}>{t.phone}</td>
                <td className="mono" style={{ padding: "10px 14px" }}>{t.mpesaReceiptNumber || "-"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span
                    className={`pill ${
                      t.status === "success" ? "pill-success" : t.status === "failed" || t.status === "cancelled" ? "pill-danger" : "pill-muted"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} className={`btn ${p === page ? "btn-primary" : "btn-ghost"}`} style={{ padding: "6px 12px" }} onClick={() => setPage(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
