import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.athenoa.com',
  // 'ignore' so the preview serves pages, and the 404 page, with or without a trailing slash.
  // Canonical URLs still carry the slash (see Seo.astro).
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') && !page.includes('/font-test/') })],
  devToolbar: { enabled: false },
  server: { port: 4321 },
});
