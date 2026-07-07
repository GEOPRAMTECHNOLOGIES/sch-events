import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ADMIN_ROUTE_SLUG } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";

const NAV = [
  { to: "", label: "Overview", icon: "\u25A3" },
  { to: "analytics", label: "Analytics & graphs", icon: "\u25B2" },
  { to: "users", label: "Users", icon: "\u25CF" },
  { to: "transactions", label: "Transactions", icon: "\u26A1" },
  { to: "events", label: "Events", icon: "\u2691" },
  { to: "check-in", label: "Check-in", icon: "\u2713" },
  { to: "notifications", label: "Notifications", icon: "\u2709" },
  { to: "logs", label: "OTP & activity logs", icon: "\u2261" },
  { to: "leaderboard", label: "Leaderboard & signups", icon: "\u2605" },
  { to: "live", label: "Live sessions", icon: "\u25CB" },
  { to: "settings", label: "Settings", icon: "\u2699" },
  { to: "admins", label: "Admins", icon: "\u26AD" },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const base = `/${ADMIN_ROUTE_SLUG}`;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div style={{ padding: "6px 10px 20px" }}>
          <div style={{ fontFamily: "var(--font-display)", color: "var(--gold)", fontSize: 16 }}>CampusPass</div>
          <div style={{ fontSize: 11, color: "#8d96b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>admin console</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to === "" ? base : `${base}/${item.to}`}
              end={item.to === ""}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? "var(--ink)" : "#c7cee0",
                background: isActive ? "var(--gold)" : "transparent",
              })}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 24, borderTop: "1px solid #33406a", paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: "#8d96b8" }}>Signed in as</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{admin?.name}</div>
          <div style={{ fontSize: 11, color: "#8d96b8" }}>{admin?.role}</div>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 10, color: "#dfe4f2", borderColor: "#33406a" }}
            onClick={() => {
              logout();
              navigate(`${base}/login`);
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
