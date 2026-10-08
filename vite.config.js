import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { SITE, SITE_NAME } from './src/config/site.js';

// Fills the site name into index.html so the file never has to be edited by hand.
const siteHtml = () => ({
  name: 'site-html',
  transformIndexHtml: (html) => html
    .replaceAll('%SITE_NAME%', SITE_NAME)
    .replaceAll('%SITE_TAGLINE%', SITE.tagline)
    .replaceAll('%SITE_URL%', SITE.url),
});

// IMG.LY 1.7.0 bundles ndarray's Function constructor. Its image path only
// needs contiguous data/shape/get/set. Replace those calls with a static view,
// not a CSP relaxation. Fail closed when the upstream layout changes.
const cspImageTensor = () => ({
  name: 'csp-image-tensor',
  enforce: 'pre',
  transform(code, id) {
    if (!id.replaceAll('\\', '/').endsWith('/@imgly/background-removal/dist/index.mjs')) return null;
    const pattern = /var import_ndarray[0-9]* = __toESM\(require_ndarray\(\)\);/g;
    const matches = code.match(pattern);
    if (matches?.length !== 4) throw new Error('IMG.LY changed: review the CSP tensor adapter before upgrading.');
    const next = code.replace(pattern, (line) => line.replace('__toESM(require_ndarray())', '{ default: cspTensor }'));
    return { code: `import cspTensor from ${JSON.stringify(path.resolve('src/lib/cspTensor.js'))};\n${next}`, map: null };
  },
});

export default defineConfig({
  plugins: [cspImageTensor(), react(), siteHtml()],
  build: { chunkSizeWarningLimit: 1500 },
});
