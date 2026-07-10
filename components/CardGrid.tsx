'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Cheatsheet } from '@/data/cheatsheets';
import Card from './Card';

/**
 * Search + responsive card grid for the landing page.
 *
 * Filtering matches the original hub: title, subtitle, description, tags AND
 * the full Markdown body (provided as a prebuilt lowercased `searchIndex`).
 * Cards can be sorted by sheet number, ascending (01 first, the default) or
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
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = q
      ? cheatsheets.filter((c) => (searchIndex[c.id] ?? '').includes(q))
      : cheatsheets;
    return [...filtered].sort((a, b) => {
      const diff = Number(a.icon) - Number(b.icon);
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [q, sortDir, cheatsheets, searchIndex]);

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
    visible.length === cheatsheets.length
      ? `${visible.length} available`
      : `${visible.length} of ${cheatsheets.length}`;

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

      <div className="cards-grid" id="cardsGrid">
        {visible.length === 0 ? (
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
