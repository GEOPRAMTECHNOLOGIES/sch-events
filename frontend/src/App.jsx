import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { useAdminAuth } from "./context/AdminAuthContext";
import { ADMIN_ROUTE_SLUG } from "./api/client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import MyTickets from "./pages/MyTickets";
import NotFound from "./pages/NotFound";

import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import Overview from "./admin/sections/Overview";
import Analytics from "./admin/sections/Analytics";
import Users from "./admin/sections/Users";
import Transactions from "./admin/sections/Transactions";
import Events from "./admin/sections/Events";
import CheckIn from "./admin/sections/CheckIn";
import Notifications from "./admin/sections/Notifications";
import Logs from "./admin/sections/Logs";
import Leaderboard from "./admin/sections/Leaderboard";
import LiveSessions from "./admin/sections/LiveSessions";
import Settings from "./admin/sections/Settings";
import Admins from "./admin/sections/Admins";

function PublicSite() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events/:idOrSlug" element={<EventDetail />} />
        {/* Friendly shareable per-event link, e.g. /#/event/freshers-night */}
        <Route path="/event/:idOrSlug" element={<EventDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

function AdminIndexRedirect() {
  const { admin } = useAdminAuth();
  if (admin?.role === "manager") return <Navigate to="events" replace />;
  return <Overview />;
}

export default function App() {
  return (
    <SiteSettingsProvider>
    <Routes>
      {/*
        The admin dashboard is intentionally NOT linked from any public nav.
        It only exists at /{ADMIN_ROUTE_SLUG} - change ADMIN_ROUTE_SLUG in your
        .env files before deploying so this path is unique to your deployment.
      */}
      <Route
        path={`/${ADMIN_ROUTE_SLUG}/*`}
        element={
          <AdminAuthProvider>
            <Routes>
              <Route path="login" element={<AdminLogin />} />
              <Route
                path="*"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<AdminIndexRedirect />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="users" element={<Users />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="events" element={<Events />} />
                <Route path="check-in" element={<CheckIn />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="logs" element={<Logs />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="live" element={<LiveSessions />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admins" element={<Admins />} />
              </Route>
            </Routes>
          </AdminAuthProvider>
        }
      />

      <Route
        path="/*"
        element={
          <AuthProvider>
            <PublicSite />
          </AuthProvider>
        }
      />
    </Routes>
    </SiteSettingsProvider>
  );
}
