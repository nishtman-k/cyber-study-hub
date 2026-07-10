'use client';

import { useEffect, useState } from 'react';
import type { Heading } from '@/lib/headings';

/**
 * Sticky table of contents built from the cheatsheet's `##` headings.
 * Click-to-scroll (smooth) + scroll-spy via IntersectionObserver, mirroring
 * the original hub's rootMargin/threshold so the active item highlights the
 * same way.
 */
export default function TOC({ headings }: { headings: Heading[] }) {
  const [activeSlug, setActiveSlug] = useState<string>(headings[0]?.slug ?? '');

  useEffect(() => {
    if (headings.length === 0) return;
    const targets = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSlug(entry.target.id);
        });
      },
      { rootMargin: '-80px 0px -75% 0px', threshold: 0 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  function handleClick(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    const target = document.getElementById(slug);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      history.replaceState(null, '', `#${slug}`);
    } catch {
      /* no-op */
    }
    setActiveSlug(slug);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-label">Table of Contents</div>
      <ul className="toc-list">
        {headings.map((h) => (
          <li key={h.slug}>
            <a
              className={`toc-link${h.slug === activeSlug ? ' active' : ''}`}
              href={`#${h.slug}`}
              onClick={(e) => handleClick(e, h.slug)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
