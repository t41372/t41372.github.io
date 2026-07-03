import { useEffect, useState } from 'react'

/**
 * Fetches the star count for a GitHub repo at runtime.
 * - sessionStorage cache so one session = one request per repo
 * - graceful degradation: if the API fails / rate-limits, show nothing
 */
export default function GithubStars({ repo }: { repo: string }) {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    const cacheKey = `gh-stars:${repo}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached !== null) {
      const n = Number(cached)
      if (!Number.isNaN(n)) setStars(n)
      return
    }

    const ac = new AbortController()
    fetch(`https://api.github.com/repos/${repo}`, {
      signal: ac.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.stargazers_count === 'number') {
          sessionStorage.setItem(cacheKey, String(data.stargazers_count))
          setStars(data.stargazers_count)
        }
      })
      .catch(() => {
        /* rate limited or offline — just show the icon without a number */
      })

    return () => ac.abort()
  }, [repo])

  const formatted =
    stars === null
      ? null
      : stars >= 1000
        ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k`
        : String(stars)

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted">
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="currentColor"
        aria-hidden="true"
        className="text-aurora"
      >
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
      </svg>
      {formatted !== null && (
        <span aria-label={`${stars} GitHub stars`}>{formatted}</span>
      )}
      <span className="sr-only">GitHub stars</span>
    </span>
  )
}
