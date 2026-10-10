import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.athenoa.com',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') && !page.includes('/font-test/') })],
  devToolbar: { enabled: false },
  server: { port: 4321 },
});
