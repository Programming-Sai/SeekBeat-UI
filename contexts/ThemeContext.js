// contexts/ThemeContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import { storageGet, storageSet } from "../lib/storage";
import { accentColors, themes, RGBA } from "../lib/colors";

const STORAGE_KEY = "@seekbeat:appearance"; // stores { themeMode, accentKey }

const ThemeContext = createContext(null);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  defaultAccent = "gold",
}) {
  const sysColorScheme = useColorScheme(); // "light" | "dark" | null
  const [isHydrated, setHydrated] = useState(false);

  // themeMode can be: 'light' | 'dark' | 'system'
  // if 'system' -> derive from useColorScheme()
  const [themeMode, setThemeMode] = useState("dark");
  const [accentKey, setAccentKey] = useState(defaultAccent);

  // load persisted
  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await storageGet(STORAGE_KEY, null);
      if (!mounted) return;
      if (stored?.themeMode) setThemeMode(stored.themeMode);
      if (stored?.accentKey) setAccentKey(stored.accentKey);
      setHydrated(true);
    })();
    return () => (mounted = false);
  }, []);

  // persist whenever themeMode or accentKey changes
  useEffect(() => {
    if (!isHydrated) return;
    storageSet(STORAGE_KEY, { themeMode, accentKey });
  }, [themeMode, accentKey, isHydrated]);

  // resolved theme: if themeMode === 'system' -> use sysColorScheme, fallback to defaultTheme
  const resolvedMode = useMemo(() => {
    if (themeMode === "system") return sysColorScheme || defaultTheme;
    return themeMode;
  }, [themeMode, sysColorScheme, defaultTheme]);

  // provide theme values merged with accent palette
  const theme = useMemo(() => {
    const base = themes[resolvedMode] || themes[defaultTheme];
    const accent = accentColors[accentKey] || accentColors[defaultAccent];

    return {
      // core colors
      ...base,

      // accent palette:
      accent: accent.base,
      accentContrast: accent.contrast,

      // small helpers (computed)
      accentAlpha: (a) => RGBA(accent.base, a),
      bgAlpha: (a) => RGBA(base.background, a),
    };
  }, [resolvedMode, accentKey, defaultTheme, defaultAccent]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setMode = (mode) => {
    // mode: 'light'|'dark'|'system'
    setThemeMode(mode);
  };

  const setAccent = (key) => {
    if (accentColors[key]) setAccentKey(key);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode, // 'light'|'dark'|'system'
        resolvedMode, // actual 'light'|'dark'
        setMode,
        toggleTheme,
        accentKey,
        setAccent,
        accentColors,
        isHydrated,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
