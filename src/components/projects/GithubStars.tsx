import { useEffect, useState } from 'react'

export type GithubMetric = 'stars' | 'downloads' | 'rank'

type Release = { assets?: { download_count?: number }[] }

// One in-flight request per URL: the stars and rank stats share the repo call.
const requests = new Map<string, Promise<unknown>>()
function getJson(url: string): Promise<unknown> {
  let request = requests.get(url)
  if (!request) {
    // Give up after 10 s (GitHub can be slow or blocked on some networks);
    // the card keeps its floor values.
    request = fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(10_000) })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data) => {
        // Forget failures (timeouts, offline, rate limits) so a later visit retries.
        if (data === null) requests.delete(url)
        return data
      })
    requests.set(url, request)
  }
  return request
}

const repoStars = async (repo: string) => {
  const count = ((await getJson(`https://api.github.com/repos/${repo}`)) as { stargazers_count?: unknown } | null)?.stargazers_count
  return typeof count === 'number' ? count : null
}

const sources: Record<GithubMetric, (repo: string) => Promise<number | null>> = {
  stars: repoStars,
  // Every asset of every release, summed: the same count the resume's figure uses.
  downloads: async (repo) => {
    const data = await getJson(`https://api.github.com/repos/${repo}/releases?per_page=100`)
    return Array.isArray(data)
      ? (data as Release[]).reduce((sum, release) => sum + (release.assets ?? []).reduce((s, a) => s + (a.download_count ?? 0), 0), 0)
      : null
  },
  // Rank by stars across GitHub: public repositories with more stars, plus one.
  // (GitHub search; star-history.com counts a different set and shows another number.)
  rank: async (repo) => {
    const stars = await repoStars(repo)
    if (stars === null) return null
    const total = ((await getJson(`https://api.github.com/search/repositories?q=stars:%3E${stars}&per_page=1`)) as { total_count?: unknown } | null)?.total_count
    return typeof total === 'number' ? total + 1 : null
  },
}

/**
 * Resolves once no Astro page transition is running (Astro sets
 * `data-astro-transition` on <html> until the view transition finishes).
 * A layout change that lands mid-transition stalls its frames (measured up to
 * ~630 ms on mobile when GitHub answered during the 420 ms crossfade), so live
 * numbers are applied after the page settles. Requests still start early.
 */
function afterPageTransition(): Promise<void> {
  const root = document.documentElement
  if (!root.hasAttribute('data-astro-transition')) return Promise.resolve()
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (root.hasAttribute('data-astro-transition')) return
      observer.disconnect()
      resolve()
    })
    observer.observe(root, { attributes: true, attributeFilter: ['data-astro-transition'] })
  })
}

/**
 * Reads a live repo number from the GitHub API at runtime, so the site never
 * needs hand-updated counts.
 * - sessionStorage cache so one session = one request per repo and metric
 * - graceful degradation: if the API fails / rate-limits, returns null and
 *   callers keep their static floor
 * - `metric` undefined is a no-op, so the hook can be called unconditionally
 */
export function useGithubMetric(repo: string, metric?: GithubMetric) {
  const [value, setValue] = useState<number | null>(null)

  useEffect(() => {
    if (!metric) return
    const cacheKey = `gh-${metric}:${repo}`
    let cached: number | null = null
    try {
      const stored = sessionStorage.getItem(cacheKey)
      if (stored !== null && !Number.isNaN(Number(stored))) cached = Number(stored)
    } catch {
      /* storage blocked — fetch instead */
    }

    const pending =
      cached !== null
        ? Promise.resolve(cached)
        : sources[metric](repo).then((n) => {
            if (n !== null) {
              try {
                sessionStorage.setItem(cacheKey, String(n))
              } catch {
                /* ignore */
              }
            }
            return n
          })

    let active = true
    void Promise.all([pending, afterPageTransition()]).then(([n]) => {
      if (active && n !== null) setValue(n)
    })
    return () => {
      active = false
    }
  }, [repo, metric])

  return value
}

/** 14707 → "14.7k" */
export function formatStars(stars: number) {
  return stars >= 1000 ? `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(stars)
}

/** 3564 → "#3,564" */
export function formatRank(rank: number) {
  return `#${rank.toLocaleString('en-US')}`
}

/** 43098 → "43k+": a floor, matching how the static figures are written */
export function formatFloor(n: number) {
  return n >= 1000 ? `${Math.floor(n / 1000)}k+` : String(n)
}
