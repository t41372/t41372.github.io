---
title: 'Hello, world (again)'
description: 'The personal site got a full rebuild — night sky, aurora, ASCII smoke, and a blog that finally works the way I want.'
pubDate: 2026-07-03
tags: ['meta', 'astro']
---

Three years after hand-writing the first version of this site, I rebuilt the whole thing.

The old site was an HTML file, a fake terminal, and a pile of CSS I wrote in a weekend. It served me well, but it was time.

## What changed

- **Astro** now powers the whole site — the landing page and this blog live in the same repo.
- The hero background is a **WebGL aurora** over a night sky, and the entire color system follows it.
- There is an ASCII house at the bottom of the landing page. Its chimney produces ASCII smoke. You can poke the smoke with your cursor. This was non-negotiable.

## How this blog works

I write Markdown in Obsidian, drop the file into `src/content/blog/`, push to `main`, and GitHub Actions builds and deploys everything. No CMS, no admin panel, no friction.

```ts
// that's it, that's the schema
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})
```

More posts soon. Probably.
