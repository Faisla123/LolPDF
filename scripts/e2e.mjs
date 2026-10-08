// End-to-end check: builds real PDFs and images, runs every tool in headless Chrome, and inspects the downloads.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

const CHROME = process.env.CHROME_PATH || (process.platform === 'linux' ? '/usr/bin/google-chrome' : null) || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:4173';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tools-e2e-'));
const only = process.argv[2];
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };

const server = spawn(process.execPath, ['scripts/security-preview.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });

async function mkPdf(file, pages, title) {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) d.addPage([400, 500]).drawText(`${title} page ${i}`, { x: 40, y: 440, size: 22, font: f });
  d.setTitle(`${title} secret title`); d.setAuthor('Test Author');
  fs.writeFileSync(file, await d.save());
}

const page0 = await browser.newPage();
await page0.goto(BASE);
const noise = async (w, h, type) => page0.evaluate(async (w, h, type) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const img = x.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) { img.data[i] = Math.random() * 255; img.data[i + 1] = Math.random() * 255; img.data[i + 2] = Math.random() * 255; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0);
  x.fillStyle = '#fff'; x.fillRect(w / 4, h / 4, w / 2, h / 2); x.fillStyle = '#c00'; x.beginPath(); x.arc(w / 2, h / 2, h / 6, 0, 7); x.fill();
  const b = await new Promise((r) => c.toBlob(r, type, 0.95));
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(s);
}, w, h, type);

const A = path.join(tmp, 'Alpha Doc.pdf'), B = path.join(tmp, 'beta.pdf');
await mkPdf(A, 3, 'Alpha'); await mkPdf(B, 2, 'Beta');
const jpgFile = path.join(tmp, 'photo one.jpg'); fs.writeFileSync(jpgFile, Buffer.from(await noise(1600, 1200, 'image/jpeg'), 'base64'));
const pngFile = path.join(tmp, 'pic.png'); fs.writeFileSync(pngFile, Buffer.from(await noise(500, 400, 'image/png'), 'base64'));
// large PDF made of noisy JPEG pages
{
  const d = await PDFDocument.create();
  for (let i = 0; i < 4; i++) {
    const j = await d.embedJpg(Buffer.from(await noise(1200, 1600, 'image/jpeg'), 'base64'));
    d.addPage([450, 600]).drawImage(j, { x: 0, y: 0, width: 450, height: 600 });
  }
  fs.writeFileSync(path.join(tmp, 'big.pdf'), await d.save());
}
const BIG = path.join(tmp, 'big.pdf');
console.log('big.pdf', fs.statSync(BIG).size, 'bytes');
await page0.close();

async function run(slug, files, setup, { wait = 60000, expectError = false } = {}) {
  const page = await browser.newPage();
  // Output tests use reduced motion; animations have their own route recorder.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.evaluateOnNewDocument(() => {
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__dl = { href: this.href, name: this.download }; return; } return orig.call(this); };
  });
  await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.intro-loader'), { timeout: 10000 });
  if (files.length) {
    const input = await page.$('[data-testid="file-input"]');
    await input.uploadFile(...files);
    await new Promise((r) => setTimeout(r, 700));
  }
  if (setup) await setup(page);
  await page.click('[data-testid="run"]');
  try {
    await page.waitForSelector('[data-testid="result"], .form-error', { timeout: wait });
  } catch { errors.push('timeout'); }
  const err = await page.$('.form-error');
  const errText = err ? await page.evaluate((e) => e.textContent, err) : null;
  let dl = null;
  if (!errText && await page.$('[data-testid="result"]')) {
    const bodyText = await page.evaluate(() => document.querySelector('[data-testid="result"]').innerText);
    await page.click('[data-testid="download"]');
    await new Promise((r) => setTimeout(r, 400));
    const got = await page.evaluate(async () => {
      if (!window.__dl) return null;
      const buf = new Uint8Array(await (await fetch(window.__dl.href)).arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return { name: window.__dl.name, b64: btoa(s) };
    });
    if (got) dl = { name: got.name, bytes: Buffer.from(got.b64, 'base64'), text: bodyText };
  }
  await page.close();
  return { dl, errText, errors };
}
const setValue = (sel, v) => async (page) => { await page.$eval(sel, (el, val) => { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; set.call(el, val); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v); };
const clickText = (text) => async (page) => { await page.evaluate((t) => { [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)?.click(); }, text); await new Promise((r) => setTimeout(r, 200)); };
const t = (name) => !only || only === name;
const pdfPages = async (bytes) => (await PDFDocument.load(bytes)).getPageCount();

// merge
if (t('merge')) {
  const r = await run('merge-pdf', [A, B]);
  ok('merge: 5 pages', r.dl && (await pdfPages(r.dl.bytes)) === 5, JSON.stringify(r.errors));
  ok('merge: friendly name', r.dl?.name === 'merged.pdf');
  const one = await run('merge-pdf', [A]);
  ok('merge: refuses one file', !!one.errText, one.errText);
}
if (t('split')) {
  let r = await run('split-pdf', [A], setValue('input[type=text]', '1-2, 3'));
  const z = r.dl && await JSZip.loadAsync(r.dl.bytes);
  ok('split ranges: 2 files in zip', z && Object.keys(z.files).length === 2, r.dl?.name);
  r = await run('split-pdf', [A], async (p) => { await clickText('Delete')(p); await setValue('input[type=text]', '2')(p); });
  ok('split delete: 2 pages left', r.dl && (await pdfPages(r.dl.bytes)) === 2);
  r = await run('split-pdf', [A], async (p) => { await clickText('Extract')(p); await setValue('input[type=text]', '9')(p); });
  ok('split: out-of-range page gives message', /outside/.test(r.errText || ''), r.errText);
}
if (t('rotate')) {
  const r = await run('rotate-pdf', [A]);
  const d = r.dl && await PDFDocument.load(r.dl.bytes);
  ok('rotate: all pages 90', d && d.getPages().every((p) => p.getRotation().angle === 90));
}
if (t('crop')) {
  const r = await run('crop-pdf', [A]);
  const d = r.dl && await PDFDocument.load(r.dl.bytes);
  ok('crop: smaller page', d && Math.round(d.getPage(0).getWidth()) < 400, d && String(d.getPage(0).getWidth()));
}
if (t('compress')) {
  const r = await run('compress-pdf', [BIG], async (p) => { await clickText('200 KB')(p); }, { wait: 120000 });
  ok('compress: target 200KB hit', r.dl && r.dl.bytes.length <= 200 * 1024, r.dl && `${r.dl.bytes.length} bytes ${JSON.stringify(r.errors)}`);
  ok('compress: output valid pdf', r.dl && (await pdfPages(r.dl.bytes)) === 4);
  const l = await run('compress-pdf', [A], clickText('Light'), { wait: 60000 });
  ok('compress light works', !!l.dl, JSON.stringify(l.errors) + (l.errText || ''));
}
if (t('organize')) {
  const r = await run('organize-pdf', [A], async (p) => {
    await p.waitForSelector('.page-card');
    await p.evaluate(() => { document.querySelectorAll('.page-card')[0].querySelector('[aria-label="Delete page"]').click(); });
  });
  ok('organize: 2 pages after delete', r.dl && (await pdfPages(r.dl.bytes)) === 2, r.errText || JSON.stringify(r.errors));
}
if (t('protect')) {
  const r = await run('protect-pdf', [A], async (p) => { const [a, b] = await p.$$('input[type=password]'); await a.type('s3cret!'); await b.type('s3cret!'); });
  let locked = false;
  try { await PDFDocument.load(r.dl.bytes); } catch { locked = true; }
  ok('protect: file is encrypted', r.dl && locked, r.errText);
  fs.writeFileSync(path.join(tmp, 'locked.pdf'), r.dl?.bytes || '');
  const bad = await run('unlock-pdf', [path.join(tmp, 'locked.pdf')], async (p) => { await p.type('input[type=password]', 'nope'); });
  ok('unlock: wrong password reported', /did not open/.test((bad.dl?.text || '') + (bad.errText || '')), bad.errText);
  const good = await run('unlock-pdf', [path.join(tmp, 'locked.pdf')], async (p) => { await p.type('input[type=password]', 's3cret!'); });
  ok('unlock: right password gives 3 pages', good.dl && (await pdfPages(good.dl.bytes)) === 3, good.errText || JSON.stringify(good.errors));
}
if (t('metadata')) {
  const r = await run('clean-pdf-metadata', [A]);
  const d = r.dl && await PDFDocument.load(r.dl.bytes, { updateMetadata: false });
  ok('metadata: title and author gone', d && !d.getTitle() && !d.getAuthor(), d && `${d.getTitle()}|${d.getAuthor()}|${d.getProducer()}`);
}
if (t('watermark')) {
  const r = await run('watermark-pdf', [A], setValue('input[type=text]', 'गोपनीय'));
  ok('watermark (Hindi) produces pdf', r.dl && (await pdfPages(r.dl.bytes)) === 3, r.errText);
  fs.writeFileSync(path.join(tmp, 'wm.pdf'), r.dl?.bytes || '');
}
if (t('numbers')) {
  const r = await run('add-page-numbers-to-pdf', [A]);
  ok('page numbers produces pdf', r.dl && (await pdfPages(r.dl.bytes)) === 3, r.errText);
}
if (t('text')) {
  const r = await run('extract-text-from-pdf', [A]);
  const txt = r.dl?.bytes.toString() || '';
  ok('extract text contains Alpha page 2', /Alpha page 2/.test(txt), txt.slice(0, 60));
}
if (t('pdf2img')) {
  const r = await run('pdf-to-jpg', [A]);
  const z = r.dl && await JSZip.loadAsync(r.dl.bytes);
  ok('pdf to jpg: 3 images', z && Object.keys(z.files).length === 3, r.dl?.name);
}
if (t('img2pdf')) {
  const r = await run('image-to-pdf', [jpgFile, pngFile]);
  ok('images to pdf: 2 pages', r.dl && (await pdfPages(r.dl.bytes)) === 2, r.errText);
  const s = await run('scan-to-pdf', [jpgFile]);
  ok('scan to pdf: 1 page', s.dl && (await pdfPages(s.dl.bytes)) === 1, s.errText);
}
if (t('sign')) {
  const r = await run('sign-pdf', [A], async (p) => {
    await p.click('button[role=radio]:nth-of-type(2)');
    await p.type('.sig-type input', 'Faisal');
    await new Promise((x) => setTimeout(x, 400));
  });
  ok('sign: pdf produced', r.dl && (await pdfPages(r.dl.bytes)) === 3, r.errText);
}
if (t('repair')) {
  const r = await run('repair-pdf', [A]);
  ok('repair: pdf produced', r.dl && (await pdfPages(r.dl.bytes)) === 3, r.errText);
}
if (t('image')) {
  let r = await run('compress-image', [jpgFile], async (p) => { await clickText('50 KB')(p); });
  ok('compress image: under 50KB', r.dl && r.dl.bytes.length <= 50 * 1024, r.dl && String(r.dl.bytes.length));
  r = await run('resize-image', [jpgFile]);
  ok('resize image: named with size', r.dl && /800x600/.test(r.dl.name), r.dl?.name);
  r = await run('convert-image', [pngFile], clickText('WebP'));
  ok('convert image: webp', r.dl && /\.webp$/.test(r.dl.name), r.dl?.name);
  r = await run('remove-photo-metadata', [jpgFile]);
  ok('strip photo data works', !!r.dl, r.errText);
  r = await run('passport-photo-maker', [jpgFile]);
  const z = r.dl && await JSZip.loadAsync(r.dl.bytes);
  ok('passport: photo + sheet zip', z && Object.keys(z.files).length === 2, r.dl?.name + ' ' + (r.errText || ''));
}
if (t('bg')) {
  const r = await run('remove-background', [pngFile], null, { wait: 150000 });
  ok('remove background (needs internet for model)', r.dl && r.dl.bytes.length > 1000, (r.errText || '') + JSON.stringify(r.errors).slice(0, 300));
}
if (t('qr')) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/qr-code-generator`, { waitUntil: 'networkidle0' });
  await page.$eval('input[type=text]', (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, 'https://example.com'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForSelector('.qr-preview img', { timeout: 10000 }).catch(() => {});
  ok('qr: preview image shown', !!(await page.$('.qr-preview img')));
  await page.close();
}
if (t('routes')) {
  const page = await browser.newPage();
  for (const p of ['/', '/tools', '/privacy', '/merge-pdf', '/nonsense-page']) {
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle0' });
    ok(`route ${p} loads`, res.status() === 200);
  }
  await page.close();
}
await browser.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
