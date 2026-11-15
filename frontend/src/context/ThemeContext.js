import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', preference: 'system', toggleTheme: () => {}, setPreference: () => {} });
export const useTheme = () => useContext(ThemeContext);

const systemTheme = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const readPref = () => {
  try { const t = localStorage.getItem('theme'); return t === 'light' || t === 'dark' ? t : 'system'; } catch (e) { return 'system'; }
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPref] = useState(readPref);
  const [system, setSystem] = useState(systemTheme);
  const theme = preference === 'system' ? system : preference;

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', theme === 'dark' ? '#0d0e10' : '#f4f3ef'));
  }, [theme]);

  const setPreference = useCallback((p) => {
    setPref(p);
    try { if (p === 'system') localStorage.removeItem('theme'); else localStorage.setItem('theme', p); } catch (e) { /* private mode */ }
  }, []);
  const toggleTheme = useCallback(() => setPreference(theme === 'dark' ? 'light' : 'dark'), [theme, setPreference]);

  return <ThemeContext.Provider value={{ theme, preference, toggleTheme, setPreference }}>{children}</ThemeContext.Provider>;
};
