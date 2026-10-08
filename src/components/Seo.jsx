import { useEffect } from 'react';
import { SITE, SITE_NAME } from '../config/site.js';

function setMeta(selector, attr, value, create) {
  let el = document.head.querySelector(selector);
  if (!el && create) { el = create(); document.head.appendChild(el); }
  if (el) el.setAttribute(attr, value);
}

export default function Seo({ title, description, path = '/', jsonLd }) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - ${SITE.tagline}`;
    document.title = full;
    const url = `${SITE.url}${path}`;
    setMeta('meta[name="description"]', 'content', description, () => Object.assign(document.createElement('meta'), { name: 'description' }));
    setMeta('link[rel="canonical"]', 'href', url, () => Object.assign(document.createElement('link'), { rel: 'canonical' }));
    setMeta('meta[property="og:title"]', 'content', full);
    setMeta('meta[property="og:description"]', 'content', description);
    let ld = document.getElementById('ld-json');
    if (jsonLd) {
      if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'ld-json'; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify(jsonLd);
    } else if (ld) ld.remove();
  }, [title, description, path, jsonLd]);
  return null;
}
