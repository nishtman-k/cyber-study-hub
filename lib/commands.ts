import fs from 'node:fs';
import path from 'node:path';
import { CHEATSHEETS, categoryOf } from '@/data/cheatsheets';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/** Fenced-code languages we treat as shell/command blocks. */
const SHELL_LANGS = new Set([
  'bash',
  'sh',
  'shell',
  'console',
  'zsh',
  'powershell',
  'ps1',
]);

/**
 * Count the runnable command lines across every cheatsheet.
 *
 * A "command" is a non-empty, non-comment line inside a shell-flavoured code
 * fence. Runs at build time (server only), so this costs nothing at runtime and
 * stays accurate as sheets are added — no hardcoded number to go stale.
 */
export function countCommands(): number {
  let total = 0;

  for (const sheet of CHEATSHEETS) {
    const file = path.join(CONTENT_DIR, categoryOf(sheet), `${sheet.id}.md`);
    let body: string;
    try {
      body = fs.readFileSync(file, 'utf8');
    } catch {
      continue; // a sheet without a body shouldn't break the landing page
    }

    let inFence = false;
    let isShell = false;
    let continued = false; // previous line ended in `\`, so this one is its tail

    for (const line of body.split('\n')) {
      const fence = line.match(/^\s*```([a-zA-Z0-9+-]*)/);
      if (fence) {
        if (inFence) {
          inFence = false;
          isShell = false;
        } else {
          inFence = true;
          isShell = SHELL_LANGS.has(fence[1].toLowerCase());
        }
        continued = false;
        continue;
      }
      if (!inFence || !isShell) continue;

      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continued = false; // blanks and comments end any continuation
        continue;
      }
      if (!continued) total += 1; // wrapped lines are one command, not several
      continued = trimmed.endsWith('\\');
    }
  }

  return total;
}