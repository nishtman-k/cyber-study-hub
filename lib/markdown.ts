import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Read the raw Markdown body for a cheatsheet id.
 * Runs at build time (server only) — never bundled to the client.
 */
export function getCheatsheetMarkdown(id: string): string {
  const file = path.join(CONTENT_DIR, `${id}.md`);
  return fs.readFileSync(file, 'utf8');
}

/**
 * Build a lightweight search index entry: the full lowercased text the landing
 * page searches against (title + subtitle + description + tags + body).
 * Mirrors the original hub, which searched the rendered Markdown content too.
 */
export function getSearchText(id: string): string {
  return getCheatsheetMarkdown(id).toLowerCase();
}
