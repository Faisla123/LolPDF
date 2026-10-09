// ONE place to rename the site (current name: lolpdf). Change `parts`, `url` and the colors here, then run:
//   npm run build
// The header logo word, page titles, sitemap, manifest and prerendered pages all read from this file.
// The logo mark (public/logo-mark.svg) and favicon files do not contain any letters, so they stay valid after a rename.
export const SITE = {
  // Shown as one word. The second part is tinted in the logo.
  parts: ['lol', 'pdf'],
  // Your live address, no trailing slash. Used for canonical links, sitemap and social previews.
  url: 'https://lol-pdf.vercel.app',
  tagline: 'Free PDF and image tools that run on your device',
  contactEmail: 'hello@example.com',
};

export const SITE_NAME = SITE.parts.join('');

// One-line change: set this to the public GitHub repository address.
export const SOURCE_URL = 'https://github.com/Faisla123/LolPDF';
