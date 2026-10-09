'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'bazaarhub-theme';
const ThemeContext = createContext(null);

/**
 * Light / dark theme for the whole app.
 * The `.dark` class on <html> is set before first paint by the inline
 * script in app/layout.js, so there is no theme flash on load.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');

  // Sync with the class the pre-paint script already applied.
  useEffect(() => {
    setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const apply = useCallback((next) => {
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    apply(isDark ? 'light' : 'dark');
  }, [apply]);

  const value = useMemo(
    () => ({ theme, setTheme: apply, toggleTheme: toggle }),
    [theme, apply, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
