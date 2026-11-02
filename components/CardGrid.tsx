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
import { useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  useEffect(() => {
    setActiveCategory(isCategory(urlTab) ? urlTab : DEFAULT_CATEGORY);
  }, [urlTab]);

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
        const saved = JSON.parse(raw) as { y: number; tab: string; query?: string; sortDir?: SortDir };
        if (saved.tab === resolvedTab && typeof saved.y === 'number') {
          if (typeof saved.query === 'string') setQuery(saved.query);
          if (saved.sortDir === 'asc' || saved.sortDir === 'desc') setSortDir(saved.sortDir);
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
        JSON.stringify({ y: window.scrollY, tab: activeCategory, query, sortDir })
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
      window.history.replaceState(null, '', url + '#cheatsheets');
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

  return (
    <section className="cheatsheet-browser" id="cheatsheets" aria-labelledby="cheatsheets-heading">
      <div className="section-title">
        <div>
          <h2 id="cheatsheets-heading">Cheatsheets</h2>
          <p className="section-caption">Choose your path. Find your next topic.</p>
        </div>
        <span className="result-count" id="visibleCount" role="status" aria-live="polite">
          {q ? `${visible.length} of ${inCategory.length} matching` : `${visible.length} available`}
        </span>
      </div>

      <div className="filter-panel">
        <div className="category-tabs" role="tablist" aria-label="Cheatsheet categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              id={`tab-${cat.id}`}
              aria-controls="cardsGrid"
              tabIndex={activeCategory === cat.id ? 0 : -1}
              aria-selected={activeCategory === cat.id}
              onKeyDown={(e) => {
                const index = CATEGORIES.findIndex((c) => c.id === cat.id);
                let next = index;
                if (e.key === 'ArrowRight') next = (index + 1) % CATEGORIES.length;
                else if (e.key === 'ArrowLeft') next = (index - 1 + CATEGORIES.length) % CATEGORIES.length;
                else if (e.key === 'Home') next = 0;
                else if (e.key === 'End') next = CATEGORIES.length - 1;
                else return;
                e.preventDefault();
                selectCategory(CATEGORIES[next].id);
                document.getElementById(`tab-${CATEGORIES[next].id}`)?.focus();
              }}
              className={`category-tab${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => selectCategory(cat.id)}
            >
              {cat.label}
              <span className="tab-count">{categoryCounts[cat.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="filter-toolbar">
          <div className="filter-search">
            <label className="filter-label" htmlFor="searchInput">Search this category</label>
            <div className="search-section">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
              <input
                ref={inputRef}
                type="search"
                className="search-input"
                id="searchInput"
                placeholder="Search topics, tools, commands…"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query ? (
                <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>×</button>
              ) : <span className="kbd-hint" aria-hidden="true">/</span>}
            </div>
          </div>
          <label className="filter-sort" htmlFor="sheet-sort">
            <span className="filter-label">Sort by sheet number</span>
            <select id="sheet-sort" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
              <option value="asc">↑ First to last</option>
              <option value="desc">↓ Last to first</option>
            </select>
          </label>
          {(query || sortDir !== 'asc') && (
            <button className="filter-reset" type="button" onClick={() => { setQuery(''); setSortDir('asc'); }}>Reset filters</button>
          )}
        </div>
      </div>

      <div
        className="cards-grid"
        id="cardsGrid"
        role="tabpanel"
        aria-labelledby={`tab-${activeCategory}`}
        tabIndex={0}
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
            <p style={{ fontSize: '14px' }}>Try another term or choose a different category.</p>
            <button type="button" className="filter-reset" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>Clear search</button>
          </div>
        ) : (
          visible.map((sheet) => <Card key={sheet.id} sheet={sheet} />)
        )}
      </div>
    </section>
  );
}
