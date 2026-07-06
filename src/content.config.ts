import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // i18n: a post is either a flat `slug.md` (single-language) or a
    // `slug/en.md` + `slug/zh.md` folder (variants share the slug/URL).
    lang: z.enum(['en', 'zh']).default('en'),
    // marks a variant as a translation (renders a note linking the original)
    translated: z.boolean().default(false),
    // other places this post is published (forum threads, zhihu, …) —
    // rendered as a muted "Also published on" footer line on the post page
    alsoOn: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
  }),
})

export const collections = { blog }
