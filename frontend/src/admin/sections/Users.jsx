import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  function load() {
    adminApi.get("/dashboard/users", { params: { search, page } }).then((res) => {
      setUsers(res.data.users);
      setPages(res.data.pages);
    });
  }

  useEffect(load, [search, page]);

  async function toggleActive(id) {
    await adminApi.patch(`/dashboard/users/${id}/toggle-active`);
    load();
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Users</h1>
      <input
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        style={{ maxWidth: 320, marginBottom: 16 }}
      />
      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Name", "Email", "Phone", "Campus", "Verified", "Status", "Joined", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td style={{ padding: "10px 14px" }}>{u.name}</td>
                <td style={{ padding: "10px 14px" }}>{u.email}</td>
                <td style={{ padding: "10px 14px" }}>{u.phone}</td>
                <td style={{ padding: "10px 14px" }}>{u.campus}</td>
                <td style={{ padding: "10px 14px" }}>{u.isVerified ? "Yes" : "No"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span className={`pill ${u.isActive ? "pill-success" : "pill-danger"}`}>{u.isActive ? "active" : "suspended"}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "10px 14px" }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => toggleActive(u._id)}>
                    {u.isActive ? "Suspend" : "Reactivate"}
                  </button>
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
