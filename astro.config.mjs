import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.athenoa.com',
  // 'ignore' so the preview serves pages, and the 404 page, with or without a trailing slash.
  // Canonical URLs still carry the slash (see Seo.astro).
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // Working pages stay out of the sitemap
      filter: (page) => !['/lab/', '/el/lab/', '/font-test/', '/grc/'].some((part) => new URL(page).pathname.startsWith(part)),
      i18n: { defaultLocale: 'en', locales: { en: 'en', el: 'el' } },
    }),
  ],
  devToolbar: { enabled: false },
  server: { port: 4321 },
});
