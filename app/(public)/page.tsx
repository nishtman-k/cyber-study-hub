import { Suspense } from 'react';
import Link from 'next/link';
import { CHEATSHEETS } from '@/data/cheatsheets';
import { getCheatsheetMarkdown } from '@/lib/markdown';
import Hero from '@/components/Hero';
import HubNav from '@/components/HubNav';
import CardGrid from '@/components/CardGrid';

/**
 * Landing page (the "hub"). Server component: reads every cheatsheet body at
 * build time to assemble a lowercased search index, then hands the sorted
 * cards + index to the client grid.
 */
export default function HomePage() {
  const searchIndex: Record<string, string> = {};
  for (const sheet of CHEATSHEETS) {
    const body = getCheatsheetMarkdown(sheet);
    searchIndex[sheet.id] = [
      sheet.title,
      sheet.subtitle,
      sheet.description,
      sheet.tags.join(' '),
      body,
    ]
      .join(' ')
      .toLowerCase();
  }

  return (
    <>
      <Suspense fallback={
        <header className="hub-header">
          <nav className="hub-nav" aria-label="Main navigation">
            <Link className="brand-mark" href="/">Cybersecurity Study Hub</Link>
          </nav>
        </header>
      }>
        <HubNav />
      </Suspense>
      <main className="home-view" id="homeView">
        <Hero />
        <Suspense fallback={<p>Loading cheatsheets…</p>}>
          <CardGrid cheatsheets={CHEATSHEETS} searchIndex={searchIndex} />
        </Suspense>
        <footer className="home-footer">
          <div className="footer-credits">
          <span>
            By{' '}
            <a className="footer-link" href="https://github.com/nishtman-k" target="_blank" rel="noopener noreferrer">
              Nishtman
            </a>{' '}
            - Built for learning. <span className="heart">♥</span>
            {'  ·  '}
            <Link className="footer-link" href="/legal">
              Legal &amp; Terms of Use
            </Link>
            {'  ·  '}
            <a
              className="footer-link"
              href="https://github.com/nishtman-k/cyber-study-hub"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source on GitHub
            </a>
          </span>
          <span className="footer-contributor">Defensive Security contributor: <span className="contributor-name">Nargiz</span></span>
          </div>
          <span>
            Press{' '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
              }}
            >
              /
            </code>{' '}
            to focus search.
          </span>
        </footer>
      </main>
    </>
  );
}
