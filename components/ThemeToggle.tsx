'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/** Shared theme switch; the root layout applies the saved theme before paint. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    function syncTheme() {
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    }
    syncTheme();
    window.addEventListener('csh-theme-change', syncTheme);
    return () => window.removeEventListener('csh-theme-change', syncTheme);
  }, []);

  function toggle() {
    const next: Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('csh-theme', next);
    } catch {
      /* The switch still works when storage is unavailable. */
    }
    setTheme(next);
    window.dispatchEvent(new Event('csh-theme-change'));
  }

  return (
    <button
      type="button"
      className="theme-switch"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Dark mode"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      <span className="theme-switch-thumb" aria-hidden="true" />
      <svg className="theme-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </svg>
      <svg className="theme-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
      </svg>
    </button>
  );
}
