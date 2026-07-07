import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const defaults = {
  siteName: "CampusPass",
  heroTitle: "Your ticket to what's on campus.",
  heroSubtitle: "Book, pay with M-Pesa, and get your QR ticket straight to your inbox — no queueing at the gate.",
  footerText: "campus events, one tap away.",
  primaryColor: "#0B4F2C",
  accentColor: "#F2B705",
  paperColor: "#FBF7EE",
};

const SiteSettingsContext = createContext({ settings: defaults, loading: true, refresh: () => {} });

function applyTheme(settings) {
  const root = document.documentElement;
  root.style.setProperty("--ink", settings.primaryColor);
  root.style.setProperty("--forest", settings.primaryColor);
  root.style.setProperty("--gradient-brand", `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.primaryColor} 55%, ${settings.primaryColor} 100%)`);
  root.style.setProperty("--gold", settings.accentColor);
  root.style.setProperty("--spark", settings.accentColor);
  root.style.setProperty("--gold-deep", settings.accentColor);
  root.style.setProperty("--spark-deep", settings.accentColor);
  root.style.setProperty("--paper", settings.paperColor);
  root.style.setProperty("--cloud", settings.paperColor);
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);

  function refresh() {
    api
      .get("/settings")
      .then((res) => {
        const merged = { ...defaults, ...res.data.settings };
        setSettings(merged);
        applyTheme(merged);
      })
      .catch(() => applyTheme(defaults))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  return <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
