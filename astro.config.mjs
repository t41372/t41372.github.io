// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  site: 'https://yi-ting.com',
  output: 'static',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    react(),
    // emits /sitemap-index.xml at build time (BaseLayout links it in <head>);
    // the archived v1 snapshot under public/archive/ is static passthrough and
    // intentionally not in the sitemap
    sitemap(),

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
