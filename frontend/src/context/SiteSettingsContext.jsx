import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const DEFAULTS = {
  siteName: "CampusPass",
  heroTitle: "Your ticket to what's on campus.",
  heroSubtitle:
    "Book, pay with M-Pesa, and get your QR ticket straight to your inbox \u2014 no queueing at the gate.",
  footerText: "CampusPass \u2014 campus events, one tap away.",
  primaryColor: "#0B6E4F", // DeKUT green
  primaryColorDark: "#084F39",
  accentColor: "#F2C14E",
  inkColor: "#1B2A4A",
};

const SiteSettingsContext = createContext({ settings: DEFAULTS, loading: true, refresh: () => {} });

function applyTheme(settings) {
  const root = document.documentElement;
  if (settings.primaryColor) root.style.setProperty("--brand", settings.primaryColor);
  if (settings.primaryColorDark) root.style.setProperty("--brand-dark", settings.primaryColorDark);
  if (settings.accentColor) root.style.setProperty("--gold", settings.accentColor);
  if (settings.inkColor) root.style.setProperty("--ink", settings.inkColor);
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  function refresh() {
    api
      .get("/settings")
      .then((res) => {
        const merged = { ...DEFAULTS, ...res.data.settings };
        setSettings(merged);
        applyTheme(merged);
      })
      .catch(() => applyTheme(DEFAULTS))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>{children}</SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
