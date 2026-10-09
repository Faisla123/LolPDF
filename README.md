# lolpdf

Free PDF and image tools that run entirely in the browser. No login, no uploads, no server.
50 tools (24 PDF/image tools plus 26 text, code, calculator, ZIP and extra image/PDF tools): merge, split, organize, rotate, compress (with exact target size), repair, images to PDF, PDF to images,
extract text, scan to PDF, watermark, page numbers, crop, sign, protect, unlock, clean metadata, remove background,
compress image, resize image, convert image, passport photo maker, remove photo data, QR code maker.

Stack: React 19, Vite, React Router, pdf-lib, pdf.js, qpdf (WebAssembly), JSZip, qrcode, @imgly/background-removal.

## Folder structure

```
lolpdf/
  index.html                  page shell (name is filled in from src/config/site.js)
  vite.config.js
  vercel.json                 clean-URL rewrite, security headers
  package.json
  public/                     logo-mark.svg, favicon.svg/.ico/.png, og.png, sw.js (offline cache)
  scripts/
    make-icons.mjs            redraws favicon PNGs, .ico and the social preview
    prerender.mjs             runs after build: per-page HTML, sitemap.xml, robots.txt, manifest
    e2e.mjs                   runs every tool in headless Chrome with real files
    shots.mjs                 takes screenshots
  src/
    main.jsx  App.jsx
    config/site.js            THE ONE FILE to rename the site
    data/tools.js             list of tools: name, URL slug, SEO title, "only here" feature
    styles/                   tokens.css, base.css, components.css, pages.css
    components/               one component per file (Header, Footer, Workspace, Dropzone, ResultPanel ...)
    pages/                    Home, ToolsPage, Privacy, NotFound
    tools/                    one file per tool (MergeTool.jsx, SplitTool.jsx ...)
    lib/                      pdf, image, qpdf, zip, history helpers
    hooks/
  docs/                       SECURITY-REVIEW.md, EXTRAS.md, SOURCES.md
```

## Setup on Windows, step by step

1. Install Node.js. Open https://nodejs.org, click the big **LTS** button, run the installer, keep pressing **Next**, then **Finish**.
2. Open the extracted `lolpdf` folder in File Explorer. Click the address bar at the top, type `cmd` and press **Enter**. A black window opens in that folder.
3. Check Node works. Type `node -v` and press Enter. You should see a version like `v22.x.x`.
4. Install the libraries. Type this and press Enter, then wait about a minute:

   ```
   npm ci
   ```

   (If you started from a folder without `package-lock.json`, use `npm install` instead.)
5. Start the site. Type:

   ```
   npm run dev
   ```

6. Open `http://localhost:5173` in Chrome. Every tool works here.
7. Stop it any time with **Ctrl + C** in the black window.

### Every install command the project uses

```
npm i react react-dom react-router-dom pdf-lib pdfjs-dist jszip qrcode @neslinesli93/qpdf-wasm @imgly/background-removal @fontsource-variable/inter @fontsource-variable/bricolage-grotesque
npm i -D vite @vitejs/plugin-react puppeteer-core
```

You do not need to type these. `npm ci` installs all of them from `package-lock.json`.

## Rename the site

1. Open `src/config/site.js` in Notepad or VS Code.
2. Change `parts` (for example `['lol', 'pdf']`), `url` (your real address) and `contactEmail`.
3. Save, then run `npm run build`. The logo word, page titles, sitemap, manifest and social preview text all follow.

The logo mark and favicon contain no letters, so they stay correct after a rename.
To redraw the social preview image with the new name run `npm run icons` (needs Chrome, see Notes).

## Build for production

```
npm run build
npm run preview
```

`build` writes the `dist` folder and also creates one HTML page per tool with its own title and description, plus `sitemap.xml` and `robots.txt`.
`preview` serves `dist` at `http://localhost:4173` so you can test it.

## Deploy on Vercel (free)

1. Push the project to your own GitHub repository (without `node_modules` and `dist`; `.gitignore` already covers them).
2. Go to https://vercel.com, sign in with GitHub, click **Add New**, then **Project**, and pick the repository.
3. Framework Preset: **Vite**. Build Command: `npm run build`. Output Directory: `dist`. No environment variables are needed.
4. Click **Deploy**. `vercel.json` already contains the rewrite so `/merge-pdf` and every other clean URL works on refresh.
5. After you have a real domain: edit `url` in `src/config/site.js`, commit, and Vercel redeploys.

## Search engines

1. After deploy, open https://search.google.com/search-console and add your site.
2. Submit `https://your-domain/sitemap.xml` under **Sitemaps**.
3. Rankings take weeks. Page titles are already written as search phrases such as "Merge PDF files into one document - Free, No Sign-up".

## Test

```
npm run build
set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
npm test
```

Creates real PDFs and images, runs the tools in headless Chrome and checks the downloaded files. The background remover test needs internet because the background-removal model is fetched once.

## Notes

- Everything runs in the visitor's browser. There is no backend and no database.
- The background remover downloads a public background-removal model (about 40 to 85 MB) from `staticimgly.com` on first use. The CSP in `vercel.json` allows exactly that host.
- Not included on purpose: PDF to Word/Excel/PowerPoint and OCR. They need server-side processing or very large models.
- Remove background, Best mode, "A person": a second model (MODNet, Apache-2.0, 26 MB) gives clean hair and hands and leaves out what the person leans on. It is served from this site (`/models/modnet.onnx`), downloaded into `public/models` by `npm install` / `npm run build` (`scripts/fetch-model.mjs`), and kept out of git. If the file is missing the tool falls back to the general model. "Object / pet" and Fast use only the general model.
- `@imgly/background-removal` is licensed AGPL-3.0. See `docs/LAUNCH-CHECKLIST.md` before a public launch. A private ZIP does not settle the source-disclosure obligations.

## Black / white / orange redesign

Black surfaces, white text, orange controls and scrollbar. The file-window illustration, logo, favicon, social preview and fine-pointer file follower use the same palette. Orange buttons use a darker orange fill for readable white labels, with bright orange borders. All 24 tools and 27 SEO pages remain.

The first-tab loader is a laughing orange face chasing a running PDF. Both have jointed stick limbs; one continuous clock blends their gait as startup moves forward. App mount, font readiness and paint stages drive the milestones, not a made-up download percentage. Minimum running time is 4.5 seconds, then a short completion beat. The whole viewport is sliced into ten horizontal 10% bands. The bands move out top-to-bottom, alternating left / right, with 90ms stagger and 900ms eased travel. There is no opacity fade or slide-up reveal. The real rendered pose is frozen into each slice so the picture stays aligned at the cut. Home is already painted behind the strips. The full opening is about 6.6 seconds on a fast first visit.

The loader runs once per tab and skips reduced motion. Background interaction and scrolling remain locked until the last strip clears. Route skeletons remain. No animation library or new dependency was added.

### Checks

- `npm run build`: 27 SEO pages, sitemap, robots and manifest.
- `npm test`: 36 real file/output checks, including all 24 tools under the local shipped CSP.
- `npm run test:ui`: 89 responsive, copy, search, cursor, accessibility-preference and intro checks.
- `node scripts/character-demo.mjs` (or `node scripts/loader-demo.mjs`): records actual desktop/mobile loader videos with captured timestamps; 28 motion/strip/interaction/CSP checks. Requires ffmpeg.
- `node scripts/premium-checks.mjs`: 40 theme, tiny-phone loader, touch cursor, strip and all-tool mobile route checks.
- `node scripts/skeleton-shot.mjs`: delayed route skeleton is replaced by the working tool.
- `node scripts/tensor-test.mjs`: static adapter comparison.
- `npm audit`: package-advisory check.

The scripts use `CHROME_PATH` or the system Chrome path. Check logs and release notes are in `docs/REDESIGN-CHECKS.md` and `docs/check-results/`. Screenshots and videos are in `screenshots/`.

No public deployment or security certification is included. Existing IMG.LY AGPL/source-publication obligations remain a launch gate; see `docs/LAUNCH-CHECKLIST.md`. The source tools, library implementations, package files and security config are unchanged from the supplied project.

## Route loader update

The full percent / LOL / ten-strip intro plays on each fresh page load.
Every in-app navigation (including Home and browser Back/Forward) plays
a faster version of the same sequence, about 1.7 seconds. Reduced-motion
users skip the animated overlay. Each navigation owns its timers, strips,
scroll lock and inert state, so canceled navigations cannot leave a stale
loader behind.

Run `node scripts/route-loader-checks.mjs` against `npm run dev -- --port 4190`
for desktop/mobile navigation checks and timestamped capture videos.

## License and source

lolpdf is free software under the GNU Affero General Public License v3.0 (see `LICENSE`). Copyright (C) 2026 Faisal Khan.

If you run a modified copy of this site for other people, the AGPL requires you to offer them the source of your version. The deployed site links its source and all third-party notices from the footer (`/licenses`). Third-party license texts are in `public/licenses/`. After changing dependencies, run `node scripts/make-licenses.mjs` to refresh them.

The repository address shown in the site footer is set in one line: `SOURCE_URL` in `src/config/site.js`.
