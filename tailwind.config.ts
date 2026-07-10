import type { Config } from 'tailwindcss';

// The visual design is driven by the CSS custom properties defined in
// app/globals.css (the "Tropical Punch" palette + fonts). We surface them here
// so future work can reach for Tailwind utilities (e.g. `text-teal`, `font-display`)
// without drifting from the source-of-truth tokens.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  // The source design ships its own minimal reset and relies on default list
  // bullets / heading margins. Disabling preflight keeps it pixel-faithful while
  // still exposing Tailwind utilities for future work.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        orange: 'var(--orange)',
        pink: 'var(--pink)',
        yellow: 'var(--yellow)',
        teal: 'var(--teal)',
        'teal-deep': 'var(--teal-deep)',
        bg: 'var(--bg)',
        'bg-elev': 'var(--bg-elev)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
