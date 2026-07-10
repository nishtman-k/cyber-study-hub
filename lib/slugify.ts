/**
 * Slugify a heading into an anchor id.
 *
 * Ported verbatim from the original study-hub so existing deep links
 * (`#cheatsheet/<id>/<section>`) keep resolving to the same anchors:
 *
 *   lower-case → strip non-word chars → trim → spaces to dashes →
 *   drop a leading run of digits/dashes.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^[0-9-]+/, '');
}
