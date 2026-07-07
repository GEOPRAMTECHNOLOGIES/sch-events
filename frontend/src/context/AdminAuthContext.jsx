import { createContext, useContext, useEffect, useState } from "react";
import { adminApi } from "../api/client";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cp_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    adminApi
      .get("/admin-auth/me")
      .then((res) => setAdmin(res.data.admin))
      .catch(() => localStorage.removeItem("cp_admin_token"))
      .finally(() => setLoading(false));
  }, []);

  function login(token, adminData) {
    localStorage.setItem("cp_admin_token", token);
    setAdmin(adminData);
  }

  function logout() {
    localStorage.removeItem("cp_admin_token");
    setAdmin(null);
  }

  return <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
