# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Yi-Ting Chiu's personal website (v2.0.0), rebuilt as a static Astro site. **The `README.md` is stale** — it describes the previous vanilla-JS "interactive terminal" site, not this codebase. Ignore it for architecture.

The old terminal site's source lives in `reference/t41372.github.io-old-version/` and is kept around as a reference for hand-tuned animations that are being ported forward (see Design below).

## Commands

Package manager is **Bun** (`bun.lock`); CI uses `bun install --frozen-lockfile`.

- `bun run dev` — local dev server (`astro dev`)
- `bun run build` — production build to `dist/`
- `bun run preview` — serve the built `dist/` locally

There is no test suite, linter, or formatter configured. Type-check with `bunx astro check` if needed.

## Architecture

- **Astro 7, static output** (`output: 'static'` in `astro.config.mjs`), `site: 'https://yi-ting.live'`. Deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`; custom domain in `public/CNAME`.
- **React 19 islands** — most of the page is static `.astro`; interactivity is opt-in via islands with explicit hydration directives. Current islands: `AuroraBackground` and `HeroIntro` (`client:load`), `GithubStars` (`client:visible`). Keep JS shipped to the client minimal — only make something an island when it needs runtime behavior.
- **Page composition** — `src/pages/index.astro` stacks `Header` → `HeroSection` → `ProjectsSection` → `ValleyScene` → `Footer`. Components are grouped by section under `src/components/{hero,projects,valley}/`. `BaseLayout.astro` wraps every page (fonts, global.css, `<head>` meta, PostHog init).
- **Blog** — Astro content collection defined in `src/content.config.ts` (frontmatter schema: `title`, `description?`, `pubDate`, `tags[]`, `draft`). Markdown lives in `src/content/blog/`; routed by `src/pages/blog/index.astro` and `src/pages/blog/[...slug].astro`. Code blocks use Shiki `catppuccin-mocha`.
- **Analytics** — `src/lib/posthog.ts`, initialized in `BaseLayout`. Silently no-ops unless `PUBLIC_POSTHOG_KEY` is set (env-gated, so local dev is clean). Never hardcode the key.
- **External data at runtime** — `GithubStars.tsx` fetches live star counts from the GitHub API client-side, with sessionStorage caching (one request per repo per session) and graceful degradation on rate-limit/offline. There is no build-time data fetching.

## Styling & design system

- **Tailwind v4 via `@tailwindcss/vite`** — there is **no `tailwind.config`**. The design system is defined in the `@theme` block of `src/styles/global.css` as `oklch` custom properties (`--color-background`, `--color-aurora`, etc.). Add/adjust design tokens there, then use them as Tailwind utilities (`bg-background`, `text-aurora`, …).
- **Fonts** — Geist / Geist Mono via `@fontsource-variable/*`, imported in `BaseLayout`.
- Custom effects (name RGB-glitch, noise overlay) live in `global.css`, ported and recolored from the old site's CSS.

## Redesign in progress — read the design brief first

Active work is a redesign on branch `redesign/2026-b`. **`reference/核心改動點.md` is the source-of-truth design brief (written in 繁體中文) and overrides default design instincts.** Read it before changing any visual/layout code. Key hard constraints from it and from project memory:

- The whole page shares **one continuous starfield background** (hero's night-sky/aurora). Foreground sections parallax over it; only the hero shows the aurora. The valley/cabin (`ValleyScene`) is hand-authored **poly/low-poly SVG illustration** (art-style ref: `reference/valley.png`), and its ground becomes the footer background. Because of this, **section/body backgrounds must stay transparent** — don't add opaque backgrounds that break the shared starfield.
- **Do not overuse green** in the UI, even though the aurora palette contains it.
- The hero intro's two-line typewriter animation was hand-tuned in the old site (sub-hundred-ms timings are intentional). When touching `HeroIntro`, preserve/restore that feel and content rather than reinventing it — cross-reference the old implementation in `reference/t41372.github.io-old-version/`. If reintroducing TypeIt, it must stay pinned at **8.0.7**.
- Avoid generic "AI-slop" patterns the brief explicitly rejects (e.g. black gaussian-blur header bars). Target aesthetic: a top-tier AI-lab / quant-fund site.
