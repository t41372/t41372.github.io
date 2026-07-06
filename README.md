# yi-ting.com

Yi-Ting Chiu's personal website — a static [Astro](https://astro.build) site.

**Live at [yi-ting.com](https://yi-ting.com) and t41372.github.io**

Previous versions of this site are preserved fully working under
[`/archive`](https://yi-ting.com/archive). v1 (2021–2026) was a hand-written interactive fake
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

Pushes to `main` deploy twice, independently: GitHub Actions builds to GitHub Pages
(t41372.github.io), and Cloudflare Pages builds the same repo for [yi-ting.com](https://yi-ting.com).
The two copies are deliberately not coupled — no custom domain on the GitHub side — so the
github.io mirror keeps working even if the domain ever lapses.
