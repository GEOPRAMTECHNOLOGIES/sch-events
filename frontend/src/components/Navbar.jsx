import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{ borderBottom: "2px dashed var(--stub-line)", background: "var(--paper)", position: "sticky", top: 0, zIndex: 20 }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.02em" }}>CampusPass</span>
          <span className="pill pill-gold" style={{ transform: "rotate(-4deg)" }}>admit one</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, fontWeight: 600 }}>
          <NavLink to="/">Events</NavLink>
          {user && <NavLink to="/my-tickets">My tickets</NavLink>}
          {user ? (
            <>
              <span style={{ color: "var(--ink-soft)" }}>Hi, {user.name.split(" ")[0]}</span>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
