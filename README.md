# kbco.work

Personal portfolio site for Kevin Coalwell — product and brand designer.

Built with React 19 + Vite, plain CSS, deployed on Vercel.

## Running locally

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # eslint
```

## How the site is organised

```
src/
  components/        Page components — one per route, plus CaseStudy
  data/
    resume.json      Name, tagline, bio, about copy, experience, skills, awards
    caseStudyLoader  Auto-discovers case studies and resolves their images
  case-studies/      One folder per project
  hooks/
    usePageMeta.js   Per-route <title>, description, and Open Graph tags
    useTheme.js      Dark/light resolution, persistence, and OS following
  index.css          Design tokens + global styles
  App.css            Everything else
```

## Adding a case study

Create `src/case-studies/<slug>/case-study.json` and drop the images into the
same folder. Nothing needs registering — the loader picks it up via
`import.meta.glob`. Start from `_template.json`.

```jsonc
{
  "title": "Project Title",
  "description": "One line for the portfolio card.",
  "image": "thumbnail.webp",       // relative to this folder
  "visible": true,
  "tags": ["Product"],             // see below
  "order": 1,                      // ascending; ties break on slug
  "caseStudy": {
    "heroImage": "hero.webp",
    "blurb": "Opening paragraph. Markdown links work here.",
    "role": "...",
    "timeline": "...",
    "team": "...",
    "overview": "...",
    "objectives": ["..."],
    "challenge": "...",
    "approach": "...",
    "userExperience": { "description": "...", "insights": ["..."] },
    "solution": "...",
    "results": ["..."],
    "images": [{ "src": "detail-1.webp", "caption": "..." }],
    "articleLink": { "url": "https://...", "label": "Read the article" }
  }
}
```

**Every narrative field is optional.** A section renders only when it has
content, so a half-written case study degrades cleanly rather than showing
empty headings. Leave a field as `""` or `[]` rather than filling it with
placeholder text — placeholder copy shipped to production once already.

### Tags

Tags drive the portfolio filter. Keep to the four in `TAG_ORDER`
(`src/components/Portfolio.jsx`) so the filter bar stays legible:

`Product` · `Brand` · `Visual` · `Motion`

The order in that constant is the order they appear, not alphabetical.

### Layouts

| `layout`        | Behaviour                                                        |
| --------------- | ---------------------------------------------------------------- |
| *(omitted)*     | Standard: blurb, meta, video, narrative sections, bento grid       |
| `gallery`       | Bento grid only. Auto-discovers **every** image in the folder      |
| `multi-gallery` | Grouped carousels; groups defined by filename `prefix`             |
| `custom`        | Renders `layout.jsx` from the same folder inside the shared chrome |

> The auto-discovering layouts pick up *every* image file in the folder. Avoid
> leaving duplicates like `image 2.webp` around — they render as duplicate
> tiles, which is exactly what happened before.

A `multi-gallery` group can be hidden without deleting anything by setting
`"visible": false` on it, the same flag a whole case study uses. Its images
stay in the folder, so restoring the row is a matter of flipping the flag
rather than working out the prefix again:

```jsonc
{ "label": "Active911", "prefix": "A911-", "visible": false }
```

## Design system

`/system` documents the live tokens — color, type, spacing, motion, and
interactive states. It reads the computed custom properties from `:root` at
runtime rather than hardcoding them, so it can't drift from `src/index.css`.

Notable constraints baked into the tokens:

- `--border-interactive` (~3.3:1 on the page background in both themes) is
  required for anything bounding a control; `--border-subtle` is for
  decorative dividers and has no contrast requirement.
- Prose is capped at `--measure` (68ch) / `--measure-narrow` (62ch).
- All motion is disabled under `prefers-reduced-motion`.
- `:focus-visible` is defined globally — do not remove outlines per-element.

### Fonts

IBM Plex Sans and Mono are **self-hosted** from `public/fonts` (Latin-1
subsets, six faces, ~116 KB), not loaded from Google Fonts. This keeps a
render-blocking third-party stylesheet off the critical path — the page makes
no external font requests — and the two above-the-fold faces are preloaded in
`index.html`. Files come from the `@ibm/plex-sans` and `@ibm/plex-mono` npm
packages; the OFL license ships alongside them.

A second benefit, currently unused: these are the official IBM Plex builds,
which retain the stylistic sets. The Google Fonts builds strip them — their
latin subset exposes only `ccmp dnom frac liga numr`, so a
`font-feature-settings` rule against it fails silently.

| Feature | Substitution | Status |
| ------- | ------------ | ------ |
| `ss01`  | single-storey `a` | available, off |
| `ss02`  | single-storey `g` | available, off |

To enable, add `font-feature-settings: 'ss01' 1, 'ss02' 1` to `body`. Both
families carry the same two features, so it inherits to the mono faces too.

No italic faces are vendored, and `font-synthesis: none` is set — markdown
`*emphasis*` in a case-study blurb will render upright rather than slanted.

### Theming

Dark and light. Dark is the canonical palette and lives on bare `:root`, so no
color is ever defined *only* inside a media query. The light palette is
declared twice: once under `@media (prefers-color-scheme: light)` guarded by
`:root:not([data-theme="dark"])`, and once under `:root[data-theme="light"]`,
so an explicit choice from the nav toggle wins in both directions.

With no stored choice the site follows the OS and keeps following it live. A
choice is stamped on `<html>` and persisted to `localStorage`. An inline
script in `index.html` applies the stored theme **before first paint** — remove
it and a light-preferring visitor gets a dark flash on every load.

Two things do not follow the theme, deliberately:

- **The lightbox** keeps a dark backdrop in both themes, so its controls use
  `--lightbox-*` tokens rather than `--text-*`, which would invert to
  near-black on a black scrim.
- **The accent differs per theme.** It is used as a link-hover color, so it
  needs 4.5:1 against its own background — the dark theme's `#43E0DB` is only
  1.6:1 on a light page, so light uses a much darker cyan.

`/system` measures every ratio live against the active theme, so switching the
toggle there shows both sets of numbers.

## Known gaps

- **No prerendering.** This is a client-rendered SPA, so crawlers without JS
  execution see an empty `<div id="root">`. Per-route titles and meta tags are
  set at runtime by `usePageMeta`. Adding a prerender step would make case
  study prose crawlable and give each route its own link preview.
- **`og-image.jpg` does not exist yet.** `index.html` references it; add a
  1200×630 image at `public/og-image.jpg` for link previews.
- **No test suite.**
