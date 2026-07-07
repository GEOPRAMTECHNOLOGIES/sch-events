import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

const emptyFilters = {
  status: "",
  eventId: "",
  phone: "",
  search: "",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  mpesaReceipt: "",
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cleanupMsg, setCleanupMsg] = useState("");

  useEffect(() => {
    adminApi.get("/events/admin/all").then((res) => setEvents(res.data.events)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = { page };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    adminApi.get("/dashboard/transactions", { params }).then((res) => {
      setTransactions(res.data.transactions);
      setPages(res.data.pages);
      setTotal(res.data.total);
    });
  }, [filters, page]);

  function setFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(emptyFilters);
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
    if (!window.confirm("Delete all failed/cancelled transactions older than 2 weeks? This cannot be undone.")) return;
    const res = await adminApi.delete("/dashboard/transactions/cleanup", { data: { statuses: ["failed", "cancelled"] } });
    setCleanupMsg(res.data.message);
    setPage(1);
    setFilters((f) => ({ ...f }));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Transactions</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-danger" onClick={handleCleanup}>Delete old failed/cancelled (2wk+)</button>
          <button className="btn btn-primary" onClick={downloadCsv}>Export CSV</button>
        </div>
      </div>

      {cleanupMsg && <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 12 }}>{cleanupMsg}</p>}

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="filters-grid">
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="initiated">Initiated</option>
          </select>

          <select value={filters.eventId} onChange={(e) => setFilter("eventId", e.target.value)}>
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>

          <input placeholder="Search name/email" value={filters.search} onChange={(e) => setFilter("search", e.target.value)} />
          <input placeholder="Phone" value={filters.phone} onChange={(e) => setFilter("phone", e.target.value)} />
          <input placeholder="M-Pesa receipt" value={filters.mpesaReceipt} onChange={(e) => setFilter("mpesaReceipt", e.target.value)} />
          <input type="date" placeholder="From" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)} />
          <input type="date" placeholder="To" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)} />
          <input type="number" placeholder="Min amount" value={filters.minAmount} onChange={(e) => setFilter("minAmount", e.target.value)} />
          <input type="number" placeholder="Max amount" value={filters.maxAmount} onChange={(e) => setFilter("maxAmount", e.target.value)} />
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>
        </div>
        <p className="help-text" style={{ margin: 0 }}>{total} matching transaction(s)</p>
      </div>

      <div className="card table-scroll">
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
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} className={`btn ${p === page ? "btn-brand" : "btn-ghost"}`} style={{ padding: "6px 12px" }} onClick={() => setPage(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
