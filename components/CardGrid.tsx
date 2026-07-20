'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  categoryOf,
  DEFAULT_CATEGORY,
  type Cheatsheet,
  type CheatsheetCategory,
} from '@/data/cheatsheets';
import Card from './Card';

const isCategory = (value: string | null): value is CheatsheetCategory =>
  CATEGORIES.some((c) => c.id === value);

// sessionStorage key for the hub's scroll position + tab across card navigation.
const SCROLL_KEY = 'csh-hub-scroll';

/**
 * Search + responsive card grid for the landing page.
 *
 * Cheatsheets are grouped into category tabs (e.g. Common Core / Offensive).
 * Within the active tab, filtering matches the original hub: title, subtitle,
 * description, tags AND the full Markdown body (a prebuilt lowercased
 * `searchIndex`). Cards sort by sheet number, ascending (01 first, default) or
 * descending. Keyboard: `/` focuses search, `Esc` clears it.
 */
type SortDir = 'asc' | 'desc';

export default function CardGrid({
  cheatsheets,
  searchIndex,
}: {
  cheatsheets: Cheatsheet[];
  searchIndex: Record<string, string>;
}) {
  const [query, setQuery] = useState('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [activeCategory, setActiveCategory] =
    useState<CheatsheetCategory>(DEFAULT_CATEGORY);
  const inputRef = useRef<HTMLInputElement>(null);

  // On mount: open on the tab named in the URL (`/?tab=offensive`) — so the
  // cheatsheet "Hub" link, deep links, and Back all land on the right tab — and
  // restore the scroll position we left from if we're returning to that tab.
  // Done in an effect (not initial state) to keep hydration matching the
  // statically-rendered default tab.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    const resolvedTab: CheatsheetCategory = isCategory(tab)
      ? tab
      : DEFAULT_CATEGORY;
    if (resolvedTab !== DEFAULT_CATEGORY) setActiveCategory(resolvedTab);

    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (raw) {
        sessionStorage.removeItem(SCROLL_KEY);
        const saved = JSON.parse(raw) as { y: number; tab: string };
        if (saved.tab === resolvedTab && typeof saved.y === 'number') {
          // Two frames so the resolved tab's cards have laid out first; jump
          // instantly (overriding the page's smooth scroll) to the exact spot.
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              window.scrollTo({ top: saved.y, left: 0, behavior: 'instant' })
            )
          );
        }
      }
    } catch {
      /* no-op */
    }
  }, []);

  // Remember scroll position + tab when the user clicks into a card, so
  // returning to the hub restores where they were (not the top).
  function rememberScroll(e: React.MouseEvent) {
    if (!(e.target as HTMLElement).closest('a.card')) return;
    try {
      sessionStorage.setItem(
        SCROLL_KEY,
        JSON.stringify({ y: window.scrollY, tab: activeCategory })
      );
    } catch {
      /* no-op */
    }
  }

  // Switch tab and reflect it in the URL (no history spam) so the choice
  // survives navigating into a card and back, and is shareable.
  function selectCategory(id: CheatsheetCategory) {
    setActiveCategory(id);
    try {
      const url =
        id === DEFAULT_CATEGORY
          ? window.location.pathname
          : `${window.location.pathname}?tab=${id}`;
      window.history.replaceState(null, '', url);
    } catch {
      /* no-op */
    }
  }

  // How many cheatsheets each tab holds (for the tab count badges).
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cheatsheets) {
      const cat = categoryOf(c);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [cheatsheets]);

  // Cards in the active tab, before search.
  const inCategory = useMemo(
    () => cheatsheets.filter((c) => categoryOf(c) === activeCategory),
    [cheatsheets, activeCategory]
  );

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = q
      ? inCategory.filter((c) => (searchIndex[c.id] ?? '').includes(q))
      : inCategory;
    return [...filtered].sort((a, b) => {
      const diff = Number(a.icon) - Number(b.icon);
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [q, sortDir, inCategory, searchIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const inField =
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

      if (e.key === '/' && !inField) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (active === inputRef.current && inputRef.current?.value) {
          setQuery('');
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const countText =
    visible.length === inCategory.length
      ? `${visible.length} available`
      : `${visible.length} of ${inCategory.length}`;

  return (
    <>
      <section className="search-section">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          id="searchInput"
          placeholder="Search cheatsheets, commands, topics…"
          autoComplete="off"
          aria-label="Search cheatsheets"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="kbd-hint">/</span>
      </section>

      <div className="section-title">
        <h2>Cheatsheets</h2>
        <div className="section-controls">
          <button
            type="button"
            className="sort-btn"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            aria-label={`Sort by sheet number, currently ${
              sortDir === 'asc' ? 'oldest first' : 'newest first'
            }. Click to reverse.`}
          >
            <span className="sort-btn-arrow" aria-hidden="true">
              {sortDir === 'asc' ? '↑' : '↓'}
            </span>
            {sortDir === 'asc' ? 'Oldest first' : 'Newest first'}
          </button>
          <span className="meta" id="visibleCount">
            {countText}
          </span>
        </div>
      </div>

      <div className="category-tabs" role="tablist" aria-label="Cheatsheet categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`category-tab${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => selectCategory(cat.id)}
          >
            {cat.label}
            <span className="tab-count">{categoryCounts[cat.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div
        className="cards-grid"
        id="cardsGrid"
        role="tabpanel"
        onClickCapture={rememberScroll}
      >
        {inCategory.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🌴</div>
            <p>No cheatsheets here yet.</p>
            <p style={{ fontSize: '14px' }}>New ones are on the way — check back soon.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🌴</div>
            <p>No cheatsheets match &quot;{query}&quot;.</p>
            <p style={{ fontSize: '14px' }}>Try a different search term.</p>
          </div>
        ) : (
          visible.map((sheet) => <Card key={sheet.id} sheet={sheet} />)
        )}
      </div>
    </>
  );
}
