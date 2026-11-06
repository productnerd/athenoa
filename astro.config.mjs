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
      filter: (page) => !['/lab/', '/el/lab/', '/font-test/', '/grc/', '/nostos/', '/el/nostos/'].some((part) => new URL(page).pathname.startsWith(part)),
      i18n: { defaultLocale: 'en', locales: { en: 'en', el: 'el' } },
    }),
  ],
  devToolbar: { enabled: false },
  // the Anthropic SDK is loaded only when the tutor is used; prepared with the rest in development, so
  // the dev server never serves a stale copy of it
  vite: { optimizeDeps: { include: ['@anthropic-ai/sdk', '@anthropic-ai/sdk/helpers/json-schema'] } },
  server: { port: 4321 },
});
