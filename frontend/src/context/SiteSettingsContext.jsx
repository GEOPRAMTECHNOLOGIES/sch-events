import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const DEFAULTS = {
  siteName: "CampusPass",
  heroTitle: "Your ticket to what's on campus.",
  heroSubtitle: "Book, pay with M-Pesa, and get your QR ticket straight to your inbox — no queueing at the gate.",
  footerText: "Campus events, one tap away.",
  inkColor: "#1b2a4a",
  goldColor: "#f2c14e",
  paperColor: "#fbf7ee",
};

const SiteSettingsContext = createContext(DEFAULTS);

function applyTheme(settings) {
  const root = document.documentElement;
  root.style.setProperty("--ink", settings.inkColor);
  root.style.setProperty("--gold", settings.goldColor);
  root.style.setProperty("--gold-deep", settings.goldColor);
  root.style.setProperty("--paper", settings.paperColor);
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    api
      .get("/settings/public")
      .then((res) => {
        const merged = { ...DEFAULTS, ...res.data };
        setSettings(merged);
        applyTheme(merged);
      })
      .catch(() => {
        // If this fails (e.g. offline), the site still works with sensible defaults.
      });
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
