'use client';

import { isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { slugify } from '@/lib/slugify';
import CodeBlock from './CodeBlock';

/** Recursively collect the plain-text of a React node tree (for heading ids). */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement(node)) {
    return nodeText((node.props as { children?: ReactNode }).children);
  }
  return '';
}

// Prepended to root-relative Markdown links so internal references (e.g.
// `/legal`) resolve under the GitHub Pages sub-path. Empty at the domain root.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Renders a cheatsheet's Markdown with GitHub-flavoured extensions and
 * highlight.js syntax colouring. `h2`s get slugified ids so the TOC anchors
 * (and deep links) resolve; `pre`s gain a copy button; root-relative links
 * are base-path-aware.
 */
export default function Markdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      components={{
        h2({ children }) {
          return <h2 id={slugify(nodeText(children))}>{children}</h2>;
        },
        pre({ children }) {
          return <CodeBlock>{children}</CodeBlock>;
        },
        a({ href, children, ...props }) {
          // Root-relative internal links get the base path; anchors and
          // absolute URLs are left untouched.
          const resolved =
            href && href.startsWith('/') ? `${BASE_PATH}${href}` : href;
          return (
            <a href={resolved} {...props}>
              {children}
            </a>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
