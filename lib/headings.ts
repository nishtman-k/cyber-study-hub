import { slugify } from './slugify';

export interface Heading {
  text: string;
  slug: string;
}

/**
 * Extract the `##` (level-2) headings from a Markdown document, in order,
 * skipping anything inside fenced code blocks. The TOC and scroll-spy are
 * built from these — matching the original hub, which used the `##` headings.
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;
  let fenceMarker = '';

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trimEnd();
    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1];
      } else if (line.trimStart().startsWith(fenceMarker)) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (m) {
      // Strip inline markdown emphasis/code markers for a clean label + slug.
      const text = m[1].replace(/[`*_]/g, '').trim();
      headings.push({ text, slug: slugify(text) });
    }
  }
  return headings;
}
