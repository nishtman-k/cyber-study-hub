'use client';

import { useEffect } from 'react';

/**
 * After the Markdown renders client-side, scroll to the `#section` anchor if the
 * URL carries one (deep links like /cheatsheet/nmap/#syn-scan keep working).
 */
export default function HashScroll() {
  useEffect(() => {
    const slug = window.location.hash.replace(/^#/, '');
    if (!slug) return;
    // Wait a frame so the rendered headings exist in the DOM.
    requestAnimationFrame(() => {
      const target = document.getElementById(slug);
      if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }, []);
  return null;
}
