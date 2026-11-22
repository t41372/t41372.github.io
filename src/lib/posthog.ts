/**
 * PostHog init — runs once per full page load.
 * Silently disabled (and zero bytes bundled) when PUBLIC_POSTHOG_KEY is not
 * provided. When enabled, loads posthog-js during browser idle time so
 * analytics never competes with hydration, WebGL boot, or route transitions.
 */
let initialized = false
let client: { capture: (event: string) => void } | null = null
let pendingViews = 0

export function initPostHog() {
  const key = import.meta.env.PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined' || initialized) return
  initialized = true

  const boot = () => {
    void import('posthog-js').then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        defaults: '2025-05-24',
        // pageviews are captured manually on astro:page-load (Astro client
        // navigations don't trigger full loads), so disable the automatic one
        // to avoid double-counting the first view
        capture_pageview: false,
        capture_pageleave: true,
      })
      client = posthog
      while (pendingViews > 0) {
        pendingViews--
        posthog.capture('$pageview')
      }
    }).catch(() => {})
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(boot, { timeout: 2500 })
  } else {
    globalThis.setTimeout(boot, 1)
  }
}

/** Capture a pageview — safe to call on every astro:page-load. */
export function capturePageView() {
  if (!initialized) return
  if (client) client.capture('$pageview')
  else pendingViews++
}
