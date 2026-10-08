// Draws favicon PNGs, the .ico file and the social preview from the SVG logo. Run: npm run icons
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chrome = process.env.CHROME_PATH || (process.platform === 'linux' ? '/usr/bin/google-chrome' : null) || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pub = path.resolve('public');
const svg = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');
const mark = fs.readFileSync(path.join(pub, 'logo-mark.svg'), 'utf8');
const { SITE } = await import(pathToUrl(path.resolve('src/config/site.js')));
function pathToUrl(p) { return new URL(`file:///${p.replace(/\\/g, '/').replace(/^\//, '')}`).href; }

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

async function png(size, file, source = svg) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${source.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body>`);
  const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  fs.writeFileSync(path.join(pub, file), buf);
  return buf;
}

const p16 = await png(16, 'favicon-16.png');
const p32 = await png(32, 'favicon-32.png');
const p48 = await png(48, 'favicon-48.png');
await png(180, 'apple-touch-icon.png');
await png(192, 'icon-192.png');
await png(512, 'icon-512.png');
void p16;

// .ico with embedded PNG images (supported by every current browser)
const imgs = [[32, p32], [48, p48]];
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let offset = 6 + imgs.length * 16;
const dirs = imgs.map(([s, b]) => { const d = Buffer.alloc(16); d[0] = s; d[1] = s; d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(b.length, 8); d.writeUInt32LE(offset, 12); offset += b.length; return d; });
fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([head, ...dirs, ...imgs.map(([, b]) => b)]));

// social preview 1200x630
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(`<body style="margin:0;width:1200px;height:630px;background:#080808;font-family:Segoe UI,Arial,sans-serif;color:#ffffff;display:flex;align-items:center;padding:0 90px;box-sizing:border-box;border:24px solid #ff6b00">
<div><div style="display:flex;align-items:center;gap:22px"><div style="width:110px;height:110px">${mark.replace('<svg ', '<svg width="110" height="110" ')}</div><div style="font-size:84px;font-weight:700;letter-spacing:-3px">${SITE.parts[0]}<span style="color:#ff6b00">${SITE.parts[1]}</span></div></div>
<div style="font-size:46px;line-height:1.2;margin-top:44px;max-width:900px;font-weight:600">${SITE.tagline}.</div>
<div style="font-size:28px;color:#bdbdbd;margin-top:22px">No sign-up. No uploads. No watermark.</div></div></body>`);
fs.writeFileSync(path.join(pub, 'og.png'), await page.screenshot({ type: 'png' }));
await browser.close();
console.log('Icons written to public/');
