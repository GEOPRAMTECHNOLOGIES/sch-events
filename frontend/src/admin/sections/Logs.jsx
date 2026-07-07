import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function Logs() {
  const [tab, setTab] = useState("otp");
  const [otpLogs, setOtpLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    adminApi.get("/dashboard/otp-logs").then((res) => setOtpLogs(res.data.logs));
    adminApi.get("/dashboard/activity-logs").then((res) => setActivityLogs(res.data.logs));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>OTP &amp; activity logs</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`btn ${tab === "otp" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("otp")}>Email / OTP logs</button>
        <button className={`btn ${tab === "activity" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("activity")}>Admin activity</button>
      </div>

      {tab === "otp" ? (
        <div className="card" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
                {["Sent", "Email", "Purpose", "Attempts", "Consumed"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {otpLogs.map((l) => (
                <tr key={l._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                  <td style={{ padding: "10px 14px" }}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px" }}>{l.email}</td>
                  <td style={{ padding: "10px 14px" }}>{l.purpose}</td>
                  <td style={{ padding: "10px 14px" }}>{l.attempts}</td>
                  <td style={{ padding: "10px 14px" }}>{l.consumedAt ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
                {["When", "Admin", "Action", "Details"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((l) => (
                <tr key={l._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                  <td style={{ padding: "10px 14px" }}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px" }}>{l.actorName}</td>
                  <td style={{ padding: "10px 14px" }}>{l.action}</td>
                  <td className="mono" style={{ padding: "10px 14px", fontSize: 11 }}>{JSON.stringify(l.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
