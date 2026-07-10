import type { Cheatsheet } from '@/data/cheatsheets';
import type { Heading } from '@/lib/headings';
import Topbar from './Topbar';
import TOC from './TOC';
import Markdown from './Markdown';
import HashScroll from './HashScroll';

/**
 * Full cheatsheet page: sticky topbar + two-column body (TOC sidebar, rendered
 * Markdown content), matching the original hub's `.cheatsheet-view` layout.
 */
export default function CheatsheetView({
  sheet,
  markdown,
  headings,
}: {
  sheet: Cheatsheet;
  markdown: string;
  headings: Heading[];
}) {
  return (
    <>
      <Topbar title={sheet.title} />
      <main className="cheatsheet-view" id="cheatsheetView">
        <TOC headings={headings} />
        <article className="content" id="contentArea">
          <Markdown markdown={markdown} />
        </article>
      </main>
      <HashScroll />
    </>
  );
}
