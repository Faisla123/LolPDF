import { SITE_NAME } from '../config/site.js';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { readBytes } from './pdfjs.js';

export { PDFDocument, degrees, rgb, StandardFonts };

export async function loadDoc(file) {
  const bytes = file instanceof Uint8Array ? file : await readBytes(file);
  return PDFDocument.load(bytes);
}

export function cleanDoc(doc) {
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer(SITE_NAME);
  doc.setCreator(SITE_NAME);
}

export async function copyPages(srcDoc, indexes) {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(srcDoc, indexes);
  pages.forEach((p) => out.addPage(p));
  return out;
}

export function toBlob(bytes) {
  return new Blob([bytes], { type: 'application/pdf' });
}

export async function textToPng(text, { size = 96, color = '#000000', font = 'sans-serif', weight = '700' } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const f = `${weight} ${size}px ${font}`;
  ctx.font = f;
  const w = Math.ceil(ctx.measureText(text).width) + 40;
  c.width = w;
  c.height = Math.ceil(size * 1.5);
  const ctx2 = c.getContext('2d');
  ctx2.font = f;
  ctx2.fillStyle = color;
  ctx2.textBaseline = 'middle';
  ctx2.fillText(text, 20, c.height / 2);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: c.width, height: c.height };
}
