import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

const emptyFilters = { status: "", event: "", phone: "", search: "", dateFrom: "", dateTo: "", minAmount: "", maxAmount: "" };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cleanupMsg, setCleanupMsg] = useState("");

  function load() {
    const params = { page };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    adminApi.get("/dashboard/transactions", { params }).then((res) => {
      setTransactions(res.data.transactions);
      setPages(res.data.pages);
      setTotal(res.data.total);
    });
  }
  useEffect(load, [filters, page]);
  useEffect(() => {
    adminApi.get("/events/admin/all").then((res) => setEvents(res.data.events)).catch(() => {});
  }, []);

  function setFilter(key, value) {
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

  async function handleDelete(id) {
    if (!window.confirm("Delete this transaction record? This cannot be undone.")) return;
    await adminApi.delete(`/dashboard/transactions/${id}`);
    load();
  }

  async function handleCleanup() {
    if (!window.confirm("Delete all non-successful transactions older than 2 weeks? This cannot be undone.")) return;
    const res = await adminApi.delete("/dashboard/transactions/cleanup-old-failed");
    setCleanupMsg(res.data.message);
    load();
  }

  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Transactions</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-danger" onClick={handleCleanup}>Clean up old failed (2+ weeks)</button>
          <button className="btn btn-primary" onClick={downloadCsv}>Export CSV</button>
        </div>
      </div>
      {cleanupMsg && <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 12 }}>{cleanupMsg}</p>}

      <div className="card" style={{ padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="initiated">Initiated</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Event</label>
          <select value={filters.event} onChange={(e) => setFilter("event", e.target.value)}>
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>{ev.title}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>User / receipt search</label>
          <input placeholder="name, email, or M-Pesa receipt" value={filters.search} onChange={(e) => setFilter("search", e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Phone</label>
          <input placeholder="07XX..." value={filters.phone} onChange={(e) => setFilter("phone", e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>From date</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilter("dateFrom", e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>To date</label>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Min amount (KSh)</label>
          <input type="number" min="0" value={filters.minAmount} onChange={(e) => setFilter("minAmount", e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Max amount (KSh)</label>
          <input type="number" min="0" value={filters.maxAmount} onChange={(e) => setFilter("maxAmount", e.target.value)} />
        </div>
        <div style={{ alignSelf: "end" }}>
          <button type="button" className="btn btn-ghost" style={{ width: "100%" }} onClick={() => { setFilters(emptyFilters); setPage(1); }}>
            Clear filters
          </button>
        </div>
      </div>

      <p className="help-text" style={{ marginBottom: 10 }}>{total} matching transaction{total === 1 ? "" : "s"}</p>

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Date", "User", "Event", "Amount", "Phone", "M-Pesa receipt", "Status", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const isOld = new Date(t.createdAt).getTime() < twoWeeksAgo;
              const deletable = t.status !== "success" && isOld;
              return (
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
                  <td style={{ padding: "10px 14px" }}>
                    {t.status !== "success" && (
                      <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => handleDelete(t._id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
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
