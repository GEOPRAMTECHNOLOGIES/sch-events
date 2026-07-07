import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = (
    <>
      <NavLink to="/" onClick={() => setMenuOpen(false)}>Events</NavLink>
      {user && <NavLink to="/my-tickets" onClick={() => setMenuOpen(false)}>My tickets</NavLink>}
      {user ? (
        <>
          <span style={{ color: "var(--ink-soft)" }}>Hi, {user.name.split(" ")[0]}</span>
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              setMenuOpen(false);
              navigate("/");
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>
            Log in
          </Link>
          <Link to="/register" className="btn btn-brand" onClick={() => setMenuOpen(false)}>
            Sign up
          </Link>
        </>
      )}
    </>
  );

  return (
    <header style={{ borderBottom: "2px dashed var(--stub-line)", background: "var(--paper)", position: "sticky", top: 0, zIndex: 20 }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.02em", color: "var(--brand-dark)" }}>
            {settings.siteName}
          </span>
          <span className="pill pill-gold" style={{ transform: "rotate(-4deg)" }}>admit one</span>
        </Link>

        <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, fontWeight: 600 }}>
          {links}
        </nav>

        <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          &#9776;
        </button>
      </div>

      {menuOpen && (
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "16px 20px 20px",
            borderTop: "1px dashed var(--stub-line)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {links}
        </nav>
      )}
    </header>
  );
}
