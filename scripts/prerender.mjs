// Runs after `vite build`. Writes one HTML file per page with its own title, description and canonical link,
// plus sitemap.xml, robots.txt and manifest. Search engines read these without having to run JavaScript.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = path.resolve('dist');
const { SITE, SITE_NAME } = await import(pathToFileURL(path.resolve('src/config/site.js')).href);
const { TOOLS } = await import(pathToFileURL(path.resolve('src/data/tools.js')).href);
const base = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page(route, title, description, h1, intro) {
  let html = base
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${SITE.url}${route}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE.url}${route}$2`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n    <div id="seo-fallback" hidden><h1>${esc(h1)}</h1><p>${esc(intro)}</p></div>`);
  const dir = route === '/' ? dist : path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

page('/', `${SITE_NAME} - ${SITE.tagline}`, `${SITE_NAME} is a free online toolbox: merge, split, compress and sign PDFs, remove image backgrounds, resize photos and more. No sign-up, files never leave your device.`, `${SITE_NAME}: free PDF and image tools`, SITE.tagline);
page('/tools', `All free PDF and image tools | ${SITE_NAME}`, `Every ${SITE_NAME} tool in one place. Free, no sign-up.`, 'All tools', TOOLS.map((t) => t.name).join(', '));
page('/privacy', `Privacy | ${SITE_NAME}`, `How ${SITE_NAME} keeps your files private: everything is processed in your browser.`, 'Privacy', 'Nothing you open here is uploaded.');
for (const t of TOOLS) {
  page(`/${t.slug}`, `${t.seo} - Free, No Sign-up | ${SITE_NAME}`, `${t.seo} online for free. No account, no watermark and no upload: your files are processed inside your browser.`, t.seo, t.tagline);
}

const routes = ['/', '/tools', '/privacy', ...TOOLS.map((t) => `/${t.slug}`)];
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${SITE.url}${r === '/' ? '' : r}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify({
  name: SITE_NAME, short_name: SITE_NAME, description: SITE.tagline, start_url: '/', display: 'standalone', background_color: '#080808', theme_color: '#080808',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));
console.log(`Prerendered ${routes.length} pages, sitemap.xml, robots.txt, manifest.`);
