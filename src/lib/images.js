import { canvasToBlob } from './pdfjs.js';

export const MAX_PIXELS = 36_000_000;

export async function loadBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new Error(`${file.name} cannot be read by this browser. Try a JPG, PNG or WebP version.`);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export const dims = (src) => ({ w: src.naturalWidth || src.width, h: src.naturalHeight || src.height });

export function drawCanvas(src, w, h, background) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export function fitWithin(w, h, max) {
  if (!max || Math.max(w, h) <= max) return { w, h };
  const k = max / Math.max(w, h);
  return { w: w * k, h: h * k };
}

export const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
export const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function encode(canvas, mime, quality = 0.9) {
  const blob = await canvasToBlob(canvas, mime, quality);
  if (blob.type !== mime) {
    // Some browsers cannot write WebP; fall back to JPEG so the user still gets a file.
    return canvasToBlob(canvas, 'image/jpeg', quality);
  }
  return blob;
}

// Finds the highest quality that fits under targetBytes, shrinking the picture when quality alone is not enough.
export async function encodeToTarget(src, w, h, mime, targetBytes, background) {
  let scale = 1;
  for (let round = 0; round < 8; round++) {
    const canvas = drawCanvas(src, w * scale, h * scale, mime === 'image/jpeg' ? background || '#ffffff' : background);
    if (mime === 'image/png') {
      const blob = await encode(canvas, mime);
      if (blob.size <= targetBytes || round === 7) return { blob, scale, hit: blob.size <= targetBytes };
    } else {
      let lo = 0.08, hi = 0.95, best = null;
      for (let i = 0; i < 7; i++) {
        const q = (lo + hi) / 2;
        const blob = await encode(canvas, mime, q);
        if (blob.size <= targetBytes) { best = blob; lo = q; } else hi = q;
      }
      if (best) return { blob: best, scale, hit: true };
    }
    scale *= 0.85;
  }
  const canvas = drawCanvas(src, w * scale, h * scale, background || '#ffffff');
  const blob = await encode(canvas, mime, 0.08);
  return { blob, scale, hit: blob.size <= targetBytes };
}

export function mimeForFile(file) {
  if (MIME[(file.name.split('.').pop() || '').toLowerCase()]) return MIME[file.name.split('.').pop().toLowerCase()];
  return file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
}

export const IMG_FLOOR = { quality: 0.6, minScale: 0.6 };

// Quality-first search: tries full size first (best quality that fits, never below the quality floor),
// then shrinks the picture a little at a time, never below minScale. Never returns a wrecked image;
// when the target is out of reach it returns the smallest acceptable result with hit: false.
export async function encodeToTargetSafe(src, w, h, mime, targetBytes) {
  const lossy = mime !== 'image/png';
  let smallest = null;
  const scales = lossy ? [1, 0.9, 0.8, 0.7, IMG_FLOOR.minScale] : [1, 0.85, 0.7, IMG_FLOOR.minScale];
  for (const scale of scales) {
    const canvas = drawCanvas(src, w * scale, h * scale, mime === 'image/jpeg' ? '#ffffff' : null);
    if (!lossy) {
      const blob = await encode(canvas, mime);
      if (!smallest || blob.size < smallest.blob.size) smallest = { blob, scale };
      if (blob.size <= targetBytes) return { blob, scale, hit: true };
      continue;
    }
    const floorBlob = await encode(canvas, mime, IMG_FLOOR.quality);
    if (!smallest || floorBlob.size < smallest.blob.size) smallest = { blob: floorBlob, scale };
    if (floorBlob.size > targetBytes) continue;
    let lo = IMG_FLOOR.quality, hi = 0.95, best = floorBlob;
    for (let i = 0; i < 6; i++) {
      const q = (lo + hi) / 2;
      const b = await encode(canvas, mime, q);
      if (b.size <= targetBytes) { best = b; lo = q; } else hi = q;
    }
    return { blob: best, scale, hit: true };
  }
  return { blob: smallest.blob, scale: smallest.scale, hit: false };
}
