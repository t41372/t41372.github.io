# yi-ting.live

Yi-Ting Chiu's personal website — a static [Astro](https://astro.build) site under one continuous
night sky: a WebGL aurora up top, a hand-drawn low-poly valley at the bottom, and an ASCII cabin
whose chimney smoke you can poke with your cursor.

**Live at [yi-ting.live](https://yi-ting.live)**

## Highlights

- **Astro 7, fully static** — React islands only where something actually moves
  (`AuroraBackground`/`StarSky`, `HeroIntro`, `GithubStars`).
- **One shared starfield** — every section parallaxes over the same sky; scroll effects are
  CSS scroll-driven animations (no JS scroll pipeline), page transitions via swup.
- **Bilingual blog** — posts live in `src/content/blog/`, either as a flat `slug.md` or as a
  `slug/en.md` + `slug/zh.md` pair sharing one URL (`/blog/slug`, `/blog/slug/zh`).
- **Site archaeology** — previous versions of this site are preserved fully working under
  [`/archive`](https://yi-ting.live/archive). v1 (2021–2026) was a hand-written interactive fake
  terminal; its source lives on the `archive/v1-terminal` branch and its snapshot in
  `public/archive/v1/`.

## Develop

Package manager is [Bun](https://bun.sh).

```sh
bun install
bun run dev        # local dev server
bun run build      # production build to dist/
bun run preview    # serve the built dist/
bun run test:e2e   # headless-Chrome smoke test against the real build
```

Type-check with `bunx astro check`. The OG social image (`public/og.png`) is a committed
screenshot of the real hero — regenerate with `bun scripts/generate-og.mjs` when the hero changes.

## Writing a post

Drop Markdown into `src/content/blog/`. Frontmatter: `title`, `pubDate`, and optionally
`description`, `tags`, `draft`, `lang` (`en`/`zh`, defaults `en`), `translated`. For a bilingual
post, make a folder with `en.md` + `zh.md` and put images in `images/` next to them.

## Deploy

Pushes to `main` build and deploy to GitHub Pages via `.github/workflows/deploy.yml`
(custom domain in `public/CNAME`).
