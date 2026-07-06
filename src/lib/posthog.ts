import posthog from 'posthog-js'

/**
 * PostHog init — runs once per full page load.
 * Silently disabled when PUBLIC_POSTHOG_KEY is not provided
 * (e.g. local dev without the env var).
 */
let initialized = false

export function initPostHog() {
  const key = import.meta.env.PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined' || initialized) return
  initialized = true

  posthog.init(key, {
    api_host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2025-05-24',
    // pageviews are captured manually on astro:page-load (swup SPA
    // navigations don't trigger full loads), so disable the automatic one
    // to avoid double-counting the first view
    capture_pageview: false,
    capture_pageleave: true,
  })
}

/** Capture a pageview — safe to call on every astro:page-load. */
export function capturePageView() {
  if (!initialized) return
  posthog.capture('$pageview')
}
