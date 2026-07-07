import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Footer() {
  const settings = useSiteSettings();
  return (
    <footer style={{ marginTop: 80, borderTop: "2px dashed var(--stub-line)", padding: "28px 0", color: "var(--ink-soft)", fontSize: 13 }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span>&copy; {new Date().getFullYear()} {settings.siteName} &mdash; {settings.footerText}</span>
        <span>Payments secured by M-Pesa</span>
      </div>
    </footer>
  );
}
