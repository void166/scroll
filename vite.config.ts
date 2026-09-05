import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Social scrapers want absolute og:image / canonical URLs. On Vercel the
 * production domain is in the build environment, so resolve it there and
 * fall back to root-relative URLs (fine locally, and fine for the scrapers
 * that do resolve them) when it is not available.
 */
function siteUrls(): Plugin {
  const site =
    process.env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '');

  return {
    name: 'vela:site-urls',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', site.replace(/\/$/, ''));
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrls()],
});
