// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Serve the custom domain from its root; canonical links and the sitemap
  // use this URL. The domain is registered in GitHub Settings → Pages.
  // Custom GitHub Actions deployments do not require a CNAME file.
  site: 'https://seismology.korea.ac.kr',

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
