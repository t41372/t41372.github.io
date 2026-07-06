import { getCollection, type CollectionEntry } from 'astro:content'

export type BlogEntry = CollectionEntry<'blog'>
export type BlogLang = 'en' | 'zh'

/**
 * One logical post, grouped from its language variants.
 *
 * Content layout:
 *   src/content/blog/my-post.md          → single-language post (lang from frontmatter)
 *   src/content/blog/my-post/en.md       → English variant   ┐ same slug,
 *   src/content/blog/my-post/zh.md       → Chinese variant   ┘ same URL space
 *
 * URLs: the primary variant (en when it exists, zh otherwise) lives at
 * /blog/<slug>; the secondary variant at /blog/<slug>/<lang>.
 */
export interface BlogPost {
  slug: string
  primary: BlogEntry
  secondary?: BlogEntry
}

export const entryLang = (entry: BlogEntry): BlogLang => {
  if (!entry.id.includes('/')) return entry.data.lang
  const base = entry.id.split('/').pop()
  if (base !== 'en' && base !== 'zh') {
    throw new Error(
      `Blog entry "${entry.id}": files nested in a post folder must be named en.md or zh.md`,
    )
  }
  return base
}

export const entrySlug = (entry: BlogEntry): string => entry.id.split('/')[0]

export async function getBlogPosts(): Promise<BlogPost[]> {
  const entries = await getCollection('blog', ({ data }) => !data.draft)
  const groups = new Map<string, Partial<Record<BlogLang, BlogEntry>>>()
  for (const entry of entries) {
    const slug = entrySlug(entry)
    const group = groups.get(slug) ?? {}
    const lang = entryLang(entry)
    if (group[lang]) {
      throw new Error(`Blog post "${slug}" has two ${lang} variants`)
    }
    group[lang] = entry
    groups.set(slug, group)
  }
  return [...groups.entries()]
    .map(([slug, v]) => ({
      slug,
      primary: (v.en ?? v.zh)!,
      secondary: v.en ? v.zh : undefined,
    }))
    .sort((a, b) => b.primary.data.pubDate.valueOf() - a.primary.data.pubDate.valueOf())
}
