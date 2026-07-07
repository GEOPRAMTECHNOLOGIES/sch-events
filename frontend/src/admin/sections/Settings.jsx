import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";

// A couple of ready-made palettes to click through instead of picking hex codes from scratch.
// The "DeKUT-inspired" one uses green + gold, in the spirit of DeKUT's crest colors - tweak
// the exact shades in the color pickers below if you want a closer match to the real thing.
const PRESETS = [
  { label: "Ticket stub (default)", inkColor: "#1b2a4a", goldColor: "#f2c14e", paperColor: "#fbf7ee" },
  { label: "DeKUT-inspired (green & gold)", inkColor: "#0b4d2c", goldColor: "#f2b705", paperColor: "#f7f6ee" },
  { label: "Campus night (navy & neon)", inkColor: "#131a33", goldColor: "#7cf29c", paperColor: "#f4f5fa" },
  { label: "Sunset", inkColor: "#3a1f4d", goldColor: "#ff8a5c", paperColor: "#fdf6f0" },
];

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.get("/dashboard/settings").then((res) => setConfig(res.data));
    adminApi.get("/settings/admin").then((res) => setForm(res.data.settings));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await adminApi.put("/settings/admin", form);
      setForm(res.data.settings);
      setSaved(true);
      // Re-apply immediately so the admin can see the effect without reloading the public site.
      const root = document.documentElement;
      root.style.setProperty("--ink", res.data.settings.inkColor);
      root.style.setProperty("--gold", res.data.settings.goldColor);
      root.style.setProperty("--gold-deep", res.data.settings.goldColor);
    } finally {
      setSaving(false);
    }
  }

  if (!config || !form) return <p>Loading&hellip;</p>;

  const rows = [
    ["M-Pesa environment", config.mpesaEnv],
    ["M-Pesa shortcode", config.mpesaShortcode],
    ["M-Pesa PartyB", config.mpesaPartyB],
    ["Gmail sending account", config.gmailUser],
    ["MongoDB", config.mongoConnected ? "Connected" : "Not connected"],
    ["Admin route slug", config.adminRouteSlug],
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Settings</h1>

      <form onSubmit={handleSave} className="card" style={{ padding: 20, marginBottom: 24, maxWidth: 640 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Site text</h3>
        <div className="field">
          <label>Site name</label>
          <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
        </div>
        <div className="field">
          <label>Homepage headline</label>
          <input value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} />
        </div>
        <div className="field">
          <label>Homepage subtitle</label>
          <textarea rows={2} value={form.heroSubtitle} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} />
        </div>
        <div className="field">
          <label>Footer text</label>
          <input value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
        </div>

        <h3 style={{ fontSize: 14 }}>Color theme</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.label}
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}
              onClick={() => setForm({ ...form, inkColor: p.inkColor, goldColor: p.goldColor, paperColor: p.paperColor })}
            >
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: p.inkColor, display: "inline-block" }} />
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: p.goldColor, display: "inline-block" }} />
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <div className="field">
            <label>Primary (ink)</label>
            <input type="color" style={{ width: "100%", height: 40 }} value={form.inkColor} onChange={(e) => setForm({ ...form, inkColor: e.target.value })} />
          </div>
          <div className="field">
            <label>Accent (gold)</label>
            <input type="color" style={{ width: "100%", height: 40 }} value={form.goldColor} onChange={(e) => setForm({ ...form, goldColor: e.target.value })} />
          </div>
          <div className="field">
            <label>Background (paper)</label>
            <input type="color" style={{ width: "100%", height: 40 }} value={form.paperColor} onChange={(e) => setForm({ ...form, paperColor: e.target.value })} />
          </div>
        </div>

        <button className="btn btn-gold" disabled={saving}>{saving ? "Saving\u2026" : "Save changes"}</button>
        {saved && <span style={{ marginLeft: 12, color: "var(--success)", fontSize: 13 }}>Saved &mdash; live on the public site now.</span>}
      </form>

      <p className="help-text" style={{ marginBottom: 16 }}>
        Below is a read-only snapshot of your deployment config. Secrets are masked here &mdash; change actual values in your server's environment variables.
      </p>
      <div className="card" style={{ padding: 4, maxWidth: 640 }}>
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
