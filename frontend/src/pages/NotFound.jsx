import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: 60, textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40 }}>404</h1>
      <p style={{ color: "var(--ink-soft)" }}>This page doesn't exist.</p>
      <Link to="/" className="btn btn-gold" style={{ marginTop: 16 }}>
        Back to events
      </Link>
    </div>
  );
}
