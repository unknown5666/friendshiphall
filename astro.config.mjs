// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// A single static page. Everything is prerendered to dist/; the CSS is inlined into the HTML (one request to first
// paint) and the only client JS is the small page bundle plus the capacity-console island, hydrated when it scrolls in.
export default defineConfig({
  site: 'https://fhscrane.com',
  integrations: [preact()],
  build: { inlineStylesheets: 'always', format: 'file' },
  compressHTML: true,
  devToolbar: { enabled: false },
  // esbuild, not Lightning CSS, minifies the CSS: Lightning CSS folds `animation-timeline` into the `animation`
  // shorthand, which browsers reject (it is reset-only there), and every scroll-driven animation silently drops.
  vite: { build: { cssMinify: 'esbuild' } },
});
