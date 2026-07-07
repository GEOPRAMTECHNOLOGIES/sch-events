import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { ADMIN_ROUTE_SLUG } from "../api/client";

export default function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div style={{ padding: 40, color: "#fff", background: "var(--ink)", minHeight: "100vh" }}>Loading&hellip;</div>;
  if (!admin) return <Navigate to={`/${ADMIN_ROUTE_SLUG}/login`} replace />;
  return children;
}
