import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * Sticky header shown on a cheatsheet page: back-to-hub link, the sheet title,
 * and the theme toggle (the only place the toggle lives, as in the original).
 */
export default function Topbar({ title }: { title: string }) {
  return (
    <header className="topbar" id="topbar">
      <Link className="back-home" href="/">
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
