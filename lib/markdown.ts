import fs from 'node:fs';
import path from 'node:path';
import { categoryOf, type Cheatsheet } from '@/data/cheatsheets';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Read the raw Markdown body for a cheatsheet.
 *
 * Bodies are organised by category folder — `content/<category>/<id>.md`
 * (e.g. `content/common-core/nmap.md`, `content/offensive/offensive-vs-defensive.md`).
 * Runs at build time (server only) — never bundled to the client.
 */
export function getCheatsheetMarkdown(sheet: Cheatsheet): string {
  const file = path.join(CONTENT_DIR, categoryOf(sheet), `${sheet.id}.md`);
  return fs.readFileSync(file, 'utf8');
}
