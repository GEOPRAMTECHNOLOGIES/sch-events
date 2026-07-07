import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    adminApi.get("/dashboard/transactions", { params: { status: status || undefined, page } }).then((res) => {
      setTransactions(res.data.transactions);
      setPages(res.data.pages);
    });
  }, [status, page]);

  async function downloadCsv() {
    const res = await adminApi.get("/dashboard/transactions/export.csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Transactions</h1>
        <button className="btn btn-primary" onClick={downloadCsv}>Export CSV</button>
      </div>

      <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} style={{ maxWidth: 220, marginBottom: 16 }}>
        <option value="">All statuses</option>
        <option value="success">Success</option>
        <option value="failed">Failed</option>
        <option value="cancelled">Cancelled</option>
        <option value="initiated">Initiated</option>
      </select>

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
