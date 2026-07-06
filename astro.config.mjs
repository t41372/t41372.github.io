// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import swup from '@swup/astro'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  site: 'https://yi-ting.com',
  output: 'static',
  integrations: [
    react(),
    // emits /sitemap-index.xml at build time (BaseLayout links it in <head>);
    // the archived v1 snapshot under public/archive/ is static passthrough and
    // intentionally not in the sitemap
    sitemap(),
    // swup, NOT Astro's native ClientRouter (View Transitions). Native VT
    // snapshots the whole page — which bakes every backdrop-filter flat and
    // dims the dark starfield mid-transition. swup swaps ONLY <main> as REAL
    // DOM: the WebGL sky, header, and footer (valley + smoke) live OUTSIDE the
    // container and are never snapshotted or re-created, and the glass cards
    // keep LIVE blur through the whole transition. Our own choreography lives
    // in BaseLayout's bridge script (theme/animationClass are off so swup runs
    // no CSS animation of its own — we drive WAAPI on <main>).
    swup({
      theme: false, // no built-in CSS theme; we animate via WAAPI in BaseLayout
      animationClass: false, // don't wait on any `transition-*` CSS timing
      containers: ['main'], // the ONLY element swapped; everything else persists
      cache: true,
      preload: { hover: true, visible: true }, // static site: prefetch aggressively
      accessibility: true, // announce + focus the new <main> for screen readers
      updateHead: true, // swap <title>/meta per page
      reloadScripts: false, // island hydration re-arms via custom-element upgrade
      smoothScrolling: false, // html already has scroll-behavior: smooth
      progress: false,
      globalInstance: true, // expose window.swup so the bridge can add hooks
      loadOnIdle: false, // init immediately — the bridge (and headless e2e) needs it
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',
    },
  },
})
