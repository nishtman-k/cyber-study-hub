'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * Dark/light toggle persisted to localStorage (key `csh-theme`).
 * The initial theme is applied pre-paint by the inline script in the root
 * layout; this just reflects + flips it. Shows ☀ in dark mode, ☾ in light —
 * same glyphs as the source hub.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('csh-theme', next);
    } catch {
      /* no-op */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="icon-btn"
      id="themeToggle"
      title="Toggle theme"
      aria-label="Toggle theme"
      onClick={toggle}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
