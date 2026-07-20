import { CHEATSHEETS } from '@/data/cheatsheets';
import { getCheatsheetMarkdown } from '@/lib/markdown';
import Hero from '@/components/Hero';
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
    <main className="home-view" id="homeView">
      <Hero />
      <CardGrid cheatsheets={CHEATSHEETS} searchIndex={searchIndex} />
      <footer className="home-footer">
        <span>
          By Nishtman - Built for learning. <span className="heart">♥</span>
        </span>
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
  );
}
