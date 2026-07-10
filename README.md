# Cybersecurity Study Hub

A friendly, hands-on collection of cybersecurity cheatsheets for learning Linux
security from the ground up. Built as a statically-exported **Next.js** app and
deployable to **GitHub Pages**.

- Landing page with colour-coded cheatsheet cards (newest first), live search
  across titles, tags **and** full content.
- Per-cheatsheet pages with rendered Markdown, a sticky table of contents
  (scroll-spy + click-to-scroll), syntax-highlighted code blocks with copy
  buttons, and a "back to hub" nav.
- Dark / light theme toggle, persisted to `localStorage`.
- Fully responsive and accessible.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript — static export
- [Tailwind CSS](https://tailwindcss.com/) (design tokens) over a ported
  "Tropical Punch" design system
- [react-markdown](https://github.com/remarkjs/react-markdown) + `remark-gfm`
  for Markdown, [`rehype-highlight`](https://github.com/rehypejs/rehype-highlight)
  (highlight.js / atom-one-dark) for code highlighting
- Fonts: Bricolage Grotesque, Outfit, JetBrains Mono

## Project structure

```
app/
  (public)/
    page.tsx                     landing page (hero + search + cards)
    cheatsheet/[id]/page.tsx     per-cheatsheet page (SSG)
  layout.tsx                     root layout, fonts, anti-flash theme script
  globals.css                    design system + highlight.js theme
  not-found.tsx
components/                      Card, CardGrid, Hero, Topbar, ThemeToggle,
                                 CheatsheetView, TOC, Markdown, CodeBlock,
                                 CopyButton, HashScroll
data/
  cheatsheets.ts                 cheatsheet metadata — single source of truth
content/                         one Markdown file per cheatsheet (<id>.md)
lib/                             markdown loading, heading extraction, slugify
.github/workflows/deploy.yml     build + publish to GitHub Pages
```

`data/cheatsheets.ts` is the source of truth: both the cards and the routes read
from it, and each entry's `id` maps to `content/<id>.md`.

## Getting started

Requires Node.js 18.18+ (Node 20 recommended).

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build & static export

`next.config.js` is configured with `output: 'export'`, so a normal build
produces a fully static site in `out/`:

```bash
npm run build      # generates ./out
```

Preview the exported site locally with any static file server, e.g.:

```bash
npx serve out
```

## Deploying to GitHub Pages

### Automated deploy (recommended)

`.github/workflows/deploy.yml` builds and publishes `out/` to GitHub Pages on
every push to `main`. To enable it:

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. If your repo name differs from `cyber-study-hub`, update
   `NEXT_PUBLIC_BASE_PATH` in the workflow.

The workflow also drops a `.nojekyll` file so Pages serves the `_next/` folder.

## Adding a cheatsheet

1. Add a Markdown file at `content/<id>.md` (use `## ` headings — they become
   the table of contents).
2. Add a matching entry to `CHEATSHEETS` in `data/cheatsheets.ts`
   (`topicCount` = number of `##` sections).

Cards sort by `icon` (highest number first).

---

By Nishtman — Built for learning. ♥
