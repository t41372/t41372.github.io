/// <reference types="astro/client" />

// @fontsource-variable/* packages ship only CSS (no type declarations); these
// side-effect imports are resolved by Vite at build time, so give TypeScript an
// ambient module so `astro check` stays green.
declare module '@fontsource-variable/geist'
declare module '@fontsource-variable/geist-mono'
