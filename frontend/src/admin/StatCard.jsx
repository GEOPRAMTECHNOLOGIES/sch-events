export default function StatCard({ label, value, hint, accent }) {
  return (
    <div className="card" style={{ padding: 18, flex: "1 1 180px" }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginTop: 6, color: accent || "var(--ink)" }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
