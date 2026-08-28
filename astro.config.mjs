import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL ?? 'https://example.com';

export default defineConfig({
  site,
  integrations: [react(), mdx(), sitemap()],
  output: 'static',
  vite: {
    build: {
      assetsInlineLimit: 2048,
    },
  },
});
