import { useEffect, useState } from "react";
import { adminApi } from "../../api/client";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Settings() {
  const { admin } = useAdminAuth();
  const { refresh } = useSiteSettings();
  const [deploy, setDeploy] = useState(null);
  const [site, setSite] = useState(null);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.get("/dashboard/settings").then((res) => setDeploy(res.data));
    adminApi.get("/settings/admin").then((res) => setSite(res.data.settings));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved("");
    try {
      const res = await adminApi.put("/settings/admin", site);
      setSite(res.data.settings);
      setSaved("Saved. The public site now reflects these changes.");
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save settings");
    }
  }

  const deployRows = deploy && [
    ["M-Pesa environment", deploy.mpesaEnv],
    ["M-Pesa shortcode", deploy.mpesaShortcode],
    ["M-Pesa PartyB", deploy.mpesaPartyB],
    ["Gmail sending account", deploy.gmailUser],
    ["MongoDB", deploy.mongoConnected ? "Connected" : "Not connected"],
    ["Admin route slug", deploy.adminRouteSlug],
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 18 }}>Settings</h1>

      {admin?.role === "superadmin" ? (
        <form onSubmit={handleSave} className="card" style={{ padding: 20, marginBottom: 24, maxWidth: 560 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Site text &amp; theme</h3>
          <p className="help-text" style={{ marginTop: -4 }}>
            Edit the homepage copy and app-wide colors. Changes apply immediately across the public site.
          </p>

          {!site ? (
            <p>Loading&hellip;</p>
          ) : (
            <>
              <div className="field">
                <label>Site name</label>
                <input value={site.siteName} onChange={(e) => setSite({ ...site, siteName: e.target.value })} />
              </div>
              <div className="field">
                <label>Hero title</label>
                <input value={site.heroTitle} onChange={(e) => setSite({ ...site, heroTitle: e.target.value })} />
              </div>
              <div className="field">
                <label>Hero subtitle</label>
                <textarea rows={2} value={site.heroSubtitle} onChange={(e) => setSite({ ...site, heroSubtitle: e.target.value })} />
              </div>
              <div className="field">
                <label>Footer text</label>
                <input value={site.footerText} onChange={(e) => setSite({ ...site, footerText: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
                <div className="field">
                  <label>Primary color</label>
                  <input type="color" value={site.primaryColor} style={{ height: 42, padding: 4 }} onChange={(e) => setSite({ ...site, primaryColor: e.target.value })} />
                </div>
                <div className="field">
                  <label>Primary (dark)</label>
                  <input type="color" value={site.primaryColorDark} style={{ height: 42, padding: 4 }} onChange={(e) => setSite({ ...site, primaryColorDark: e.target.value })} />
                </div>
                <div className="field">
                  <label>Accent color</label>
                  <input type="color" value={site.accentColor} style={{ height: 42, padding: 4 }} onChange={(e) => setSite({ ...site, accentColor: e.target.value })} />
                </div>
                <div className="field">
                  <label>Ink (text) color</label>
                  <input type="color" value={site.inkColor} style={{ height: 42, padding: 4 }} onChange={(e) => setSite({ ...site, inkColor: e.target.value })} />
                </div>
              </div>

              {error && <p className="error-text">{error}</p>}
              {saved && <p style={{ color: "var(--success)", fontSize: 13 }}>{saved}</p>}
              <button className="btn btn-brand">Save changes</button>
            </>
          )}
        </form>
      ) : (
        <p className="help-text" style={{ marginBottom: 24 }}>Only superadmins can change site-wide text and colors.</p>
      )}

      <p className="help-text" style={{ marginBottom: 16 }}>
        Read-only snapshot of your deployment config. Secrets are masked here &mdash; change actual values in your server's .env file.
      </p>
      <div className="card" style={{ padding: 4 }}>
        {deployRows?.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px dashed var(--stub-line)" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{label}</span>
            <span className="mono" style={{ fontSize: 13 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
