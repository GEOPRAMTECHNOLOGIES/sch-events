import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Settings() {
  const { refresh } = useSiteSettings();
  const [deployment, setDeployment] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.get("/dashboard/settings").then((res) => setDeployment(res.data));
    adminApi.get("/settings").then((res) => setForm(res.data.settings));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved("");
    try {
      await adminApi.put("/settings/admin", form);
      setSaved("Saved! The public site now reflects these changes.");
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save settings");
    }
  }

  if (!deployment || !form) return <p>Loading&hellip;</p>;

  const deploymentRows = [
    ["M-Pesa environment", deployment.mpesaEnv],
    ["M-Pesa shortcode", deployment.mpesaShortcode],
    ["M-Pesa PartyB", deployment.mpesaPartyB],
    ["Gmail sending account", deployment.gmailUser],
    ["MongoDB", deployment.mongoConnected ? "Connected" : "Not connected"],
    ["Admin route slug", deployment.adminRouteSlug],
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Settings</h1>

      <form onSubmit={handleSave} className="card" style={{ padding: 20, marginBottom: 24, maxWidth: 560 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Site text & branding</h3>
        <p className="help-text" style={{ marginBottom: 16 }}>Edit the words and colors shown across the public site — no code changes needed.</p>

        <div className="field">
          <label>Site name</label>
          <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
        </div>
        <div className="field">
          <label>Hero title (home page headline)</label>
          <input value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} />
        </div>
        <div className="field">
          <label>Hero subtitle</label>
          <textarea rows={2} value={form.heroSubtitle} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} />
        </div>
        <div className="field">
          <label>Footer tagline</label>
          <input value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>Primary color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="color" style={{ width: 48, padding: 2 }} value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
              <input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Accent color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="color" style={{ width: 48, padding: 2 }} value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
              <input value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Paper / background color</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="color" style={{ width: 48, padding: 2 }} value={form.paperColor} onChange={(e) => setForm({ ...form, paperColor: e.target.value })} />
              <input value={form.paperColor} onChange={(e) => setForm({ ...form, paperColor: e.target.value })} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, padding: 12, borderRadius: 8, background: form.primaryColor, color: "#fff" }}>
          <span className="pill" style={{ background: form.accentColor, color: form.primaryColor }}>Preview</span>
          <span>{form.heroTitle}</span>
        </div>

        {error && <p className="error-text">{error}</p>}
        {saved && <p style={{ color: "var(--success)", fontSize: 13 }}>{saved}</p>}
        <button className="btn btn-gold" style={{ marginTop: 14 }}>Save changes</button>
      </form>

      <p className="help-text" style={{ marginBottom: 16 }}>
        Read-only snapshot of your deployment config below. Secrets are masked &mdash; change actual values in your server's .env file.
      </p>
      <div className="card" style={{ padding: 4 }}>
        {deploymentRows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px dashed var(--stub-line)" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{label}</span>
            <span className="mono" style={{ fontSize: 13 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
