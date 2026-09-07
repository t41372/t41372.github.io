// timeZone UTC: frontmatter dates like `pubDate: 2025-02-15` parse as UTC
// midnight, so formatting in the build machine's local zone shifted them a
// day early — render the calendar date as written
export const formatDate = (d: Date, month: 'short' | 'long' = 'short', lang: 'en' | 'zh' = 'en') =>
  d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month, day: 'numeric', timeZone: 'UTC' })
