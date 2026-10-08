// Takes the screenshots used in the guide. Run: npm run shots (needs `npm run build` first)
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = process.env.CHROME_PATH || (process.platform === 'linux' ? '/usr/bin/google-chrome' : null) || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'] });
const out = 'screenshots';
fs.mkdirSync(out, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(name, url, vp, after, full = false) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.evaluateOnNewDocument(()=>sessionStorage.setItem('lolpdf-opened','1'));
  await page.goto(`http://localhost:4173${url}`, { waitUntil: 'networkidle0' });
  await wait(900);
  if (!vp.isMobile) { await page.mouse.move(vp.width * 0.62, vp.height * 0.4, { steps: 8 }); }
  if (after) await after(page);
  await wait(700);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  await page.close();
}
const D = { width: 1440, height: 900, deviceScaleFactor: 1 };
const M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

await shot('desktop-home', '/', D);
await shot('desktop-tools', '/tools', D, async (p) => { await p.mouse.move(520, 420, { steps: 8 }); });
await shot('mobile-home', '/', M);
await shot('mobile-compress', '/compress-pdf', M);
await shot('desktop-compress', '/compress-pdf', D);
await shot('desktop-search', '/', D, async (p) => { await p.keyboard.down('Control'); await p.keyboard.press('k'); await p.keyboard.up('Control'); await p.keyboard.type('back'); });

// pages with real files loaded
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
const tmpDir = fs.mkdtempSync('shot-');
async function samplePdf(name, pages) {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.HelveticaBold);
  const colors = [[0.85, 0.8, 1], [1, 0.85, 0.9], [0.85, 0.95, 0.9], [1, 0.93, 0.8], [0.82, 0.9, 1], [0.95, 0.85, 0.85]];
  for (let i = 0; i < pages; i++) {
    const p = d.addPage([400, 520]);
    p.drawRectangle({ x: 0, y: 0, width: 400, height: 520, color: rgb(...colors[i % 6]) });
    p.drawText(`Page ${i + 1}`, { x: 40, y: 440, size: 40, font: f, color: rgb(0.15, 0.1, 0.3) });
    for (let l = 0; l < 8; l++) p.drawRectangle({ x: 40, y: 380 - l * 28, width: 320 - (l % 3) * 50, height: 8, color: rgb(0.4, 0.35, 0.55) });
  }
  const file = `${tmpDir}/${name}`;
  fs.writeFileSync(file, await d.save());
  return file;
}
const six = await samplePdf('Annual report.pdf', 6);
async function withFile(name, url, vp, file, after) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.evaluateOnNewDocument(()=>sessionStorage.setItem('lolpdf-opened','1'));
  await page.goto(`http://localhost:4173${url}`, { waitUntil: 'networkidle0' });
  await (await page.$('[data-testid="file-input"]')).uploadFile(file);
  await wait(1800);
  if (after) await after(page);
  if (!vp.isMobile) await page.mouse.move(vp.width * 0.4, vp.height * 0.55, { steps: 6 });
  await wait(900);
  await page.screenshot({ path: `${out}/${name}.png` });
  await page.close();
}
await withFile('desktop-organize', '/organize-pdf', D, six);
await withFile('desktop-merge', '/merge-pdf', D, six);
await withFile('desktop-result', '/rotate-pdf', D, six, async (p) => { await p.click('[data-testid="run"]'); await p.waitForSelector('[data-testid="result"]'); });
await withFile('mobile-result', '/rotate-pdf', M, six, async (p) => { await p.click('[data-testid="run"]'); await p.waitForSelector('[data-testid="result"]'); });
fs.rmSync(tmpDir, { recursive: true, force: true });
await browser.close();
server.kill();
console.log('Screenshots saved in', out);
