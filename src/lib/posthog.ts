import posthog from 'posthog-js'

/**
 * PostHog init — runs once per full page load.
 * Silently disabled when PUBLIC_POSTHOG_KEY is not provided
 * (e.g. local dev without the env var).
 */
export function initPostHog() {
  const key = import.meta.env.PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined') return

  posthog.init(key, {
    api_host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2025-05-24',
    capture_pageview: true,
    capture_pageleave: true,
  })
}
