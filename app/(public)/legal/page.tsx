import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { DEFAULT_CATEGORY } from '@/data/cheatsheets';
import Topbar from '@/components/Topbar';
import Markdown from '@/components/Markdown';

export const metadata: Metadata = {
  title: 'Legal & Terms of Use · Cybersecurity Study Hub',
  description:
    'Legal notice and terms of use for this educational cybersecurity resource: authorized use only, no warranty, limitation of liability, and open-source terms.',
};

/** Standalone legal notice, rendered from `content/legal.md`. */
export default function LegalPage() {
  const markdown = fs.readFileSync(
    path.join(process.cwd(), 'content', 'legal.md'),
    'utf8'
  );

  return (
    <>
      <Topbar title="Legal & Terms of Use" category={DEFAULT_CATEGORY} />
      <main className="cheatsheet-view" style={{ gridTemplateColumns: '1fr' }}>
        <article
          className="content"
          style={{ margin: '0 auto', maxWidth: '820px' }}
        >
          <Markdown markdown={markdown} />
        </article>
      </main>
    </>
  );
}
