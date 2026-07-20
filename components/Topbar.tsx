import Link from 'next/link';
import { DEFAULT_CATEGORY, type CheatsheetCategory } from '@/data/cheatsheets';
import ThemeToggle from './ThemeToggle';

/**
 * Sticky header shown on a cheatsheet page: back-to-hub link, the sheet title,
 * and the theme toggle (the only place the toggle lives, as in the original).
 *
 * The Hub link is category-aware — it returns to the tab the current sheet
 * belongs to (e.g. `/?tab=offensive`) rather than always the default tab.
 */
export default function Topbar({
  title,
  category,
}: {
  title: string;
  category: CheatsheetCategory;
}) {
  const hubHref =
    category === DEFAULT_CATEGORY ? '/' : `/?tab=${category}`;

  return (
    <header className="topbar" id="topbar">
      <Link className="back-home" href={hubHref}>
        <span>←</span> <span>Hub</span>
      </Link>
      <span className="topbar-title" id="topbarTitle">
        {title}
      </span>
      <span className="topbar-spacer" />
      <div className="topbar-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
