import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const read = () => { try { return localStorage.getItem('theme') || 'system'; } catch { return 'system'; } };

/** Thème : « system » (suit l'appareil), « light » ou « dark ». */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(read);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    try { theme === 'system' ? localStorage.removeItem('theme') : localStorage.setItem('theme', theme); } catch { /* ignore */ }
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
