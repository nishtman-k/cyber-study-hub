import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CHEATSHEETS, getCheatsheet } from '@/data/cheatsheets';
import { getCheatsheetMarkdown } from '@/lib/markdown';
import { extractHeadings } from '@/lib/headings';
import CheatsheetView from '@/components/CheatsheetView';

// Only the cheatsheets we generate exist; anything else 404s (required for export).
export const dynamicParams = false;

/** Pre-render one static page per cheatsheet. */
export function generateStaticParams() {
  return CHEATSHEETS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sheet = getCheatsheet(id);
  if (!sheet) return { title: 'Not found · Cybersecurity Study Hub' };
  return {
    title: `${sheet.title} · Cybersecurity Study Hub`,
    description: sheet.description,
  };
}

export default async function CheatsheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheet = getCheatsheet(id);
  if (!sheet) notFound();

  const markdown = getCheatsheetMarkdown(id);
  const headings = extractHeadings(markdown);

  return (
    <CheatsheetView sheet={sheet} markdown={markdown} headings={headings} />
  );
}
