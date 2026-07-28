import type { Metadata } from 'next';
import { Bricolage_Grotesque, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// ---------------------------------------------------------------------------
// Fonts are self-hosted: `next/font/google` downloads the files at build time
// and serves them from our own origin, so a visitor's browser never contacts
// Google and no IP address leaves the site. Each exposes a CSS variable that
// the `--font-*` design tokens in globals.css point at.
// ---------------------------------------------------------------------------

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
  axes: ['opsz'],
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Cybersecurity Study Hub',
  description:
    'A friendly, hands-on collection of cybersecurity cheatsheets for learning Linux security from the ground up.',
};

// Applied before paint so the saved theme never flashes the wrong colours.
const themeScript = `(function(){try{var t=localStorage.getItem('csh-theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
