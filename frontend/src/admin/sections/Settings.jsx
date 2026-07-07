import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

export default function Settings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    adminApi.get("/dashboard/settings").then((res) => setSettings(res.data));
  }, []);

  if (!settings) return <p>Loading&hellip;</p>;

  const rows = [
    ["M-Pesa environment", settings.mpesaEnv],
    ["M-Pesa shortcode", settings.mpesaShortcode],
    ["M-Pesa PartyB", settings.mpesaPartyB],
    ["Gmail sending account", settings.gmailUser],
    ["MongoDB", settings.mongoConnected ? "Connected" : "Not connected"],
    ["Admin route slug", settings.adminRouteSlug],
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Settings</h1>
      <p className="help-text" style={{ marginBottom: 16 }}>
        Read-only snapshot of your deployment config. Secrets are masked here &mdash; change actual values in your server's .env file.
      </p>
      <div className="card" style={{ padding: 4 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px dashed var(--stub-line)" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{label}</span>
            <span className="mono" style={{ fontSize: 13 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
