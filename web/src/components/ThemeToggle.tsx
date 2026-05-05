import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import '../styles/ThemeToggle.css';

const THEME_STORAGE_KEY = 'ui-theme';

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'dark') {
        return true;
      }
      if (storedTheme === 'light') {
        return false;
      }
    } catch {
      // Ignore storage access issues and fall back to default theme.
    }

    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // Ignore storage access issues and keep runtime theme in memory.
    }
  }, [dark]);

  return (
    <label className="theme-slider">
      <input
        type="checkbox"
        checked={dark}
        onChange={() => setDark(d => !d)}
        aria-label="Toggle dark mode"
      />
      <span className="track">
        <span className="thumb">
          {dark ? <Moon size={18} /> : <Sun size={18} />}
        </span>
      </span>
    </label>
  );
}