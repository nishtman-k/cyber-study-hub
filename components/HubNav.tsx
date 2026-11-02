'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, DEFAULT_CATEGORY } from '@/data/cheatsheets';
import ThemeToggle from './ThemeToggle';

export default function HubNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hash, setHash] = useState('');
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const navRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const category = CATEGORIES.some((item) => item.id === tab) ? tab : DEFAULT_CATEGORY;
  const homeActive = !tab && hash !== '#cheatsheets';

  function navigate(nextHash: string) {
    setHash(nextHash);
    setMobileOpen(false);
  }

  useEffect(() => {
    function syncHash() { setHash(window.location.hash); }
    syncHash();
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
    };
  }, [searchParams]);

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) setMobileOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
        burgerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [mobileOpen]);

  return (
    <header className="hub-header">
      <nav className="hub-nav" aria-label="Main navigation" ref={navRef}>
        <Link className="brand-mark" href="/#homeView" onClick={() => navigate('#homeView')}>
          Cybersecurity Study Hub
        </Link>
        <div className={`hub-nav-links${mobileOpen ? ' is-open' : ''}`} id="hub-nav-links">
          <Link
            className="hub-nav-link"
            aria-current={homeActive ? 'page' : undefined}
            href="/#homeView"
            onClick={() => navigate('#homeView')}
          >Home</Link>
          {CATEGORIES.map((item) => (
            <Link
              key={item.id}
              className="hub-nav-link"
              aria-current={!homeActive && category === item.id ? 'page' : undefined}
              href={item.id === DEFAULT_CATEGORY ? '/#cheatsheets' : `/?tab=${item.id}#cheatsheets`}
              onClick={() => navigate('#cheatsheets')}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hub-nav-actions">
          <ThemeToggle />
          <button
            className={`nav-burger${mobileOpen ? ' is-open' : ''}`}
            type="button"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            aria-controls="hub-nav-links"
            onClick={() => setMobileOpen((open) => !open)}
            ref={burgerRef}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>
    </header>
  );
}
