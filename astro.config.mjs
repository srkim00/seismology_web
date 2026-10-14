// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Your site's production URL — used for canonical links + the sitemap.
  //
  // • Custom/apex domain: set it here (e.g. 'https://lab.example.edu')
  //   and put that same host in public/CNAME. Do NOT set `base`.
  // • No custom domain (project page at <user>.github.io/<repo>): instead use
  //   site: 'https://<user>.github.io' and base: '/<repo>', and delete public/CNAME.
  site: 'https://srkim00.github.io',
  base: '/seismology_web',

  vite: {
    plugins: [tailwindcss()]
  },

  // Preserve the migrated member images without requiring a native Sharp
  // binary in local or GitHub Pages builds.
  image: {
    service: { entrypoint: 'astro/assets/services/noop' }
  },

  integrations: [sitemap()]
});
