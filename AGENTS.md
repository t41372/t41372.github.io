# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Yi-Ting Chiu's personal website (v2), a static Astro site at https://yi-ting.com (also t41372.github.io; the old yi-ting.live domain expired). v2 shipped in 2026, replacing the hand-written "interactive terminal" site (v1, 2021–2026). v1 is preserved twice: its source on the `archive/v1-terminal` branch (tag `v1-terminal`), and a browsable snapshot served at `/archive/v1/` from `public/archive/v1/`.

## Commands

Package manager is **Bun** (`bun.lock`); CI uses `bun install --frozen-lockfile`.

- `bun run dev` — local dev server (`astro dev`)
- `bun run build` — production build to `dist/`
- `bun run preview` — serve the built `dist/` locally
- `bun run test:e2e` — headless-Chrome smoke test (`scripts/e2e-smoke.mjs`); builds + serves the real `dist/` by default, `E2E_BASE=<url>` to reuse a running server. Run it after touching anything visual/scroll/transition-related — it asserts the regressions that have actually happened (WebGL sky, parallax, nav pill, glass-card flash, iOS scroll invariants).
- `bun scripts/generate-og.mjs` — regenerate `public/og.png` (committed screenshot of the real hero). Run only when the hero visibly changes.

There is no linter or formatter configured. Type-check with `bunx astro check` (CI gates on it being clean: 0 errors / 0 warnings / 0 hints).

## Architecture

- **Astro 7, static output** (`output: 'static'` in `astro.config.mjs`), `site: 'https://yi-ting.com'`. Push to `main` deploys **twice, deliberately uncoupled**: GitHub Actions (`.github/workflows/deploy.yml`) → t41372.github.io, and Cloudflare Pages (git-connected to this repo) → yi-ting.com. **Never set a custom domain on the GitHub Pages side and never add a `public/CNAME`** — the github.io copy must stay a full standalone mirror (no redirect to a domain that can lapse) so the site outlives domain ownership. `@astrojs/sitemap` emits `/sitemap-index.xml`. All workflows must stay zizmor-clean (SHA-pinned actions, least-privilege permissions) — check with `uvx zizmor .github/workflows/*.yml`.
- **React 19 islands** — most of the page is static `.astro`; interactivity is opt-in via islands with explicit hydration directives. Keep JS shipped to the client minimal — only make something an island when it needs runtime behavior.
- **Page transitions are swup, NOT Astro's ClientRouter** — swup swaps only `<main>`; the WebGL sky, header, and footer persist outside it. The bridge script in `BaseLayout.astro` re-emits the `astro:*` navigation events and choreographs the WAAPI fade/drift. Read the comments in `BaseLayout.astro` and `astro.config.mjs` before touching navigation, and never animate opacity on a backdrop-blur element or transform/opacity on its ancestors (documented "empirical law" in BaseLayout — it blanks the glass for a frame).
- **Pages** — `/` (hero), `/projects` (`src/data/projects.ts`; each entry has an optional `media` field), `/blog`, `/archive` (the version museum), plus the raw v1 snapshot under `public/archive/v1/`. Components grouped under `src/components/{hero,projects,valley}/`. `BaseLayout.astro` wraps every page (fonts, global.css, `<head>` meta + OG tags, PostHog init).
- **Blog (bilingual)** — content collection defined in `src/content.config.ts`; frontmatter: `title`, `description?`, `pubDate`, `tags[]`, `draft`, `lang` (`en`/`zh`, default `en`), `translated`. A post is either a flat `slug.md` or a folder `slug/en.md` + `slug/zh.md` (images colocated in `slug/images/`). Grouping/URL logic lives in `src/lib/blog.ts`: the primary variant (en when present) serves at `/blog/slug`, the other at `/blog/slug/<lang>`; `src/pages/blog/[...slug].astro` renders both and shows the EN/中文 toggle. Ten posts were migrated from the old hexo blog (2022–2025, still live at https://blog.yi-ting.com — don't break it, external links point there); their zh files are the originals, en files are reviewed translations (`translated: true`).
- **Analytics** — `src/lib/posthog.ts`, initialized in `BaseLayout`. Silently no-ops unless `PUBLIC_POSTHOG_KEY` is set. Never hardcode the key.
- **External data at runtime** — `GithubStars.tsx` fetches star counts client-side with sessionStorage caching and graceful degradation. No build-time data fetching.

## Styling & design system

- **Tailwind v4 via `@tailwindcss/vite`** — there is **no `tailwind.config`**. The design system is the `@theme` block in `src/styles/global.css` (`oklch` custom properties: `--color-background`, `--color-aurora`, …). Add tokens there, use them as utilities (`bg-background`, `text-aurora`).
- **Fonts** — Geist / Geist Mono via `@fontsource-variable/*`, imported in `BaseLayout`.
- Custom effects (name RGB-glitch, noise overlay, `.prose-night` article typography) live in `global.css`.

## Design constraints (hard-won — do not regress)

- The whole page shares **one continuous starfield background**; only the hero shows the aurora. Section/body backgrounds must stay transparent — never add an opaque background that breaks the shared sky. The valley/cabin (`ValleyScene`) is hand-authored low-poly SVG; its ground is the footer background.
- **Do not overuse green** in the UI, even though the aurora palette contains it.
- The hero's two-line typewriter is a **hand-rolled TypeIt replica** (no `typeit` dependency); its sub-hundred-ms timings are intentional. Preserve the feel — don't reinvent it.
- **No JS scroll-coupling.** Every scroll-linked effect is a CSS scroll-driven animation. GSAP ScrollTrigger scrubbing structurally lags on iOS, and `normalizeScroll(true)` broke touch scrolling on real iPhones — never reintroduce either.
- iOS Safari survival kit is documented inline: sky fallback layers, `min-h-lvh` (not `dvh`), the `html` edge-background swapper in BaseLayout, `viewport-fit=cover`. Trust the comments.
- Avoid generic "AI-slop" patterns (e.g. black gaussian-blur header bars). Target aesthetic: a top-tier AI-lab / quant-fund site.

## Archiving a future version

When the next redesign ships: snapshot the final `dist/` (or source, if it's plain static files) into `public/archive/v<N>/`, strip analytics scripts and absolute-path asset refs, add an exhibit entry in `src/pages/archive.astro`, and branch+tag the pre-redesign `main` as `archive/v<N>-<name>`.
