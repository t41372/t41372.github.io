import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { getBlogPosts } from '../lib/blog'

// One item per logical post, pointing at the primary variant (en when one
// exists, zh otherwise — see lib/blog.ts); the other language is reachable
// from the in-article toggle, so the feed stays deduplicated.
export const GET: APIRoute = async (context) => {
  const posts = await getBlogPosts()
  return rss({
    title: 'Yi-Ting Chiu — Blog',
    description: 'Writings by Yi-Ting Chiu.',
    site: context.site!,
    items: posts.map(({ slug, primary }) => ({
      title: primary.data.title,
      description: primary.data.description,
      pubDate: primary.data.pubDate,
      link: `/blog/${slug}/`,
    })),
  })
}
