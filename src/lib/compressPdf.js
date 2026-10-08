import { PDFDocument, PDFName, PDFRawStream, PDFRef, PDFNumber, PDFArray, PDFDict, decodePDFRawStream } from 'pdf-lib';
import { canvasToBlob } from './pdfjs.js';
import { readBytes } from './pdfjs.js';
import { runQpdf } from './qpdf.js';

// How compression works here (all in the browser):
// 1. Lossless pass: qpdf repacks the file structure. Pixels and text are untouched.
// 2. Image pass: only the pictures inside the PDF are re-encoded, in place. Text stays real text,
//    so it stays sharp and selectable. A picture is only replaced when the new one is clearly smaller.
// 3. Resolution is only reduced when a picture holds far more pixels than the page can show
//    (more than maxDpi). Quality never goes below the floors below.
export const PRESETS = {
  quality: { label: 'Same quality', maxDpi: 300, quality: 0.9, note: 'Looks the same as the original. Saves the most it can without changing how pages look.' },
  balanced: { label: 'Balanced', maxDpi: 200, quality: 0.85, note: 'Visually the same on screen and in normal prints. Good default.' },
  small: { label: 'Smaller', maxDpi: 150, quality: 0.76, note: 'Still sharp for reading. Fine details in photos may soften a little.' },
};
export const FLOOR = { dpi: 130, quality: 0.6 };
const MIN_GAIN = 0.9; // keep a recompressed picture only when it is at least 10% smaller

export async function compressLight(bytes) {
  const attempt = (extra) => runQpdf(bytes, (i, o) => [
    '--object-streams=generate', '--recompress-flate', '--compression-level=9', ...extra, i, o,
  ]);
  let res;
  try { res = await attempt(['--optimize-images']); } catch { res = await attempt([]); }
  return res.bytes;
}

const nameOf = (v) => (v instanceof PDFName ? v.asString() : null);
function filtersOf(dict) {
  const f = dict.get(PDFName.of('Filter'));
  if (!f) return [];
  if (f instanceof PDFArray) return f.asArray().map((x) => nameOf(x));
  return [nameOf(f)];
}
const num = (ctx, v) => { const r = v && ctx.lookup(v); return r instanceof PDFNumber ? r.asNumber() : null; };

function colorInfo(ctx, dict) {
  const cs = ctx.lookup(dict.get(PDFName.of('ColorSpace')));
  const n = nameOf(cs);
  if (n === '/DeviceRGB' || n === '/CalRGB') return 3;
  if (n === '/DeviceGray' || n === '/CalGray') return 1;
  if (cs instanceof PDFArray) {
    const first = nameOf(ctx.lookup(cs.get(0)));
    if (first === '/ICCBased') {
      const prof = ctx.lookup(cs.get(1));
      const N = prof?.dict ? num(ctx, prof.dict.get(PDFName.of('N'))) : null;
      return N === 3 || N === 1 ? N : 0;
    }
    if (first === '/CalRGB') return 3;
    if (first === '/CalGray') return 1;
  }
  return 0; // CMYK, Indexed, Separation and others are left alone
}

// Finds how big (in points) each picture is drawn on the page, by reading page content streams.
function placements(doc) {
  const ctx = doc.context;
  const map = new Map(); // ref tag -> max drawn width in pt
  for (const page of doc.getPages()) {
    try {
      const res = page.node.Resources();
      const xo = res && ctx.lookup(res.get(PDFName.of('XObject')));
      if (!(xo instanceof PDFDict)) continue;
      const names = new Map();
      for (const [k, v] of xo.entries()) if (v instanceof PDFRef) names.set(k.asString(), v);
      let contents = page.node.Contents();
      const streams = contents instanceof PDFArray ? contents.asArray().map((r) => ctx.lookup(r)) : [contents];
      let text = '';
      for (const s of streams) {
        if (!s) continue;
        const bytes = s instanceof PDFRawStream ? decodePDFRawStream(s).decode() : s.getContents?.();
        if (bytes) { let t = ''; for (let i = 0; i < bytes.length; i += 8192) t += String.fromCharCode(...bytes.subarray(i, i + 8192)); text += `${t}\n`; }
      }
      const re = /(-?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+(-?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+(-?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+(-?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+(-?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+(-?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+cm\b|(?:^|[\s\]>)])(q|Q)(?=[\s\n]|$)|(\/[^\s/\[\]<>()]+)\s+Do\b/g;
      let m = [1, 0, 0, 1, 0, 0];
      const stack = [];
      const mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
      let x;
      while ((x = re.exec(text))) {
        if (x[1] !== undefined) m = mul([+x[1], +x[2], +x[3], +x[4], +x[5], +x[6]], m);
        else if (x[7] === 'q') stack.push(m);
        else if (x[7] === 'Q') m = stack.pop() || [1, 0, 0, 1, 0, 0];
        else if (x[8]) {
          const ref = names.get(x[8]);
          if (ref) {
            const w = Math.hypot(m[0], m[1]);
            const key = ref.tag;
            map.set(key, Math.max(map.get(key) || 0, w));
          }
        }
      }
    } catch { /* unreadable page content: its pictures just keep full size */ }
  }
  return map;
}

export function listImages(doc) {
  const ctx = doc.context;
  const drawn = placements(doc);
  const out = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const d = obj.dict;
    if (nameOf(d.get(PDFName.of('Subtype'))) !== '/Image') continue;
    if (d.has(PDFName.of('ImageMask')) && ctx.lookup(d.get(PDFName.of('ImageMask')))?.toString() === 'true') continue;
    if (d.has(PDFName.of('Mask')) || d.has(PDFName.of('Decode'))) continue;
    const w = num(ctx, d.get(PDFName.of('Width')));
    const h = num(ctx, d.get(PDFName.of('Height')));
    const bpc = num(ctx, d.get(PDFName.of('BitsPerComponent')));
    if (!w || !h || w * h < 40_000 || bpc !== 8) continue;
    const comps = colorInfo(ctx, d);
    if (!comps) continue;
    const f = filtersOf(d);
    const kind = f.length === 1 && f[0] === '/DCTDecode' ? 'jpeg' : f.length === 1 && f[0] === '/FlateDecode' ? 'flate' : null;
    if (!kind) continue;
    out.push({ ref, obj, w, h, comps, kind, size: obj.contents.length, drawnPt: drawn.get(ref.tag) || 0, hasSMask: d.has(PDFName.of('SMask')) });
  }
  return out;
}

export async function bitmapOf(img) {
  if (img.kind === 'jpeg') return createImageBitmap(new Blob([img.obj.contents], { type: 'image/jpeg' }));
  const raw = decodePDFRawStream(img.obj).decode();
  if (raw.length < img.w * img.h * img.comps) return null;
  const rgba = new Uint8ClampedArray(img.w * img.h * 4);
  for (let i = 0, p = 0, q = 0; i < img.w * img.h; i++, q += 4) {
    if (img.comps === 3) { rgba[q] = raw[p++]; rgba[q + 1] = raw[p++]; rgba[q + 2] = raw[p++]; } else { const g = raw[p++]; rgba[q] = rgba[q + 1] = rgba[q + 2] = g; }
    rgba[q + 3] = 255;
  }
  return createImageBitmap(new ImageData(rgba, img.w, img.h));
}

// Re-encodes the pictures in a PDF. Returns { bytes, changed, savedImages }.
export async function recompressImages(bytes, { maxDpi, quality }, onProgress) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const images = listImages(doc);
  let changed = 0;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    onProgress?.(i / Math.max(1, images.length));
    try {
      // Without a known drawn size we never reduce pixels, only re-encode.
      let scale = 1;
      if (img.drawnPt > 0) {
        const dpi = img.w / (img.drawnPt / 72);
        if (dpi > maxDpi * 1.15) scale = maxDpi / dpi;
      }
      // A flate (lossless) picture that is not shrunk is only converted when it is large; small ones stay lossless.
      if (img.kind === 'flate' && scale === 1 && img.size < 150_000) continue;
      const bmp = await bitmapOf(img);
      if (!bmp) continue;
      const tw = Math.max(16, Math.round(img.w * scale));
      const th = Math.max(16, Math.round(img.h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = tw; canvas.height = th;
      const c = canvas.getContext('2d');
      c.imageSmoothingQuality = 'high';
      c.fillStyle = '#fff'; c.fillRect(0, 0, tw, th);
      c.drawImage(bmp, 0, 0, tw, th);
      bmp.close?.();
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      canvas.width = canvas.height = 0;
      if (blob.size >= img.size * MIN_GAIN) continue;
      const data = new Uint8Array(await blob.arrayBuffer());
      const dict = { Type: 'XObject', Subtype: 'Image', Width: tw, Height: th, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode' };
      const stream = doc.context.stream(data, dict);
      const sm = img.obj.dict.get(PDFName.of('SMask'));
      if (sm) stream.dict.set(PDFName.of('SMask'), sm);
      doc.context.assign(img.ref, stream);
      changed++;
    } catch { /* leave this picture as it is */ }
  }
  onProgress?.(1);
  const out = await doc.save({ useObjectStreams: true });
  return { bytes: out, changed, total: images.length };
}

async function finish(bytes) {
  try { return await compressLight(bytes); } catch { return bytes; }
}

// Preset compression: images only, then a lossless structure pass. Never returns something bigger than the input.
export async function compressPreset(original, presetKey, onProgress) {
  const p = PRESETS[presetKey];
  let best = await finish(original);
  onProgress?.(0.2, 'Re-encoding pictures');
  try {
    const r = await recompressImages(original, p, (x) => onProgress?.(0.2 + 0.6 * x, 'Re-encoding pictures'));
    if (r.changed) {
      const f = await finish(r.bytes);
      if (f.length < best.length) best = f;
    }
    return { bytes: best.length < original.length ? best : original, images: r.total, changed: r.changed };
  } catch {
    return { bytes: best.length < original.length ? best : original, images: 0, changed: 0 };
  }
}

// Steps from best to the floor. The first one that fits the target wins, so you get the best quality that fits.
const LADDER = [
  { maxDpi: 300, quality: 0.92 }, { maxDpi: 250, quality: 0.88 }, { maxDpi: 200, quality: 0.85 }, { maxDpi: 170, quality: 0.8 },
  { maxDpi: 150, quality: 0.76 }, { maxDpi: 140, quality: 0.7 }, { maxDpi: FLOOR.dpi, quality: 0.65 }, { maxDpi: FLOOR.dpi, quality: FLOOR.quality },
];

export async function compressToTarget(file, targetBytes, onProgress) {
  const original = await readBytes(file);
  onProgress?.(0.05, 'Repacking the file');
  const light = await finish(original);
  if (light.length <= targetBytes) return { bytes: light, hit: true, level: 'lossless' };
  let lo = 0, hi = LADDER.length - 1, best = null, bestIdx = -1, tries = 0;
  const cache = new Map();
  const attempt = async (idx) => {
    if (cache.has(idx)) return cache.get(idx);
    tries++;
    const r = await recompressImages(original, LADDER[idx], (x) => onProgress?.(0.1 + 0.85 * Math.min(0.99, (tries - 1 + x) / 4), `Trying quality step ${idx + 1} of ${LADDER.length}`));
    const f = r.changed ? await finish(r.bytes) : light;
    const bytes = f.length < light.length ? f : light;
    cache.set(idx, bytes);
    return bytes;
  };
  // Check the floor first: if even the floor cannot fit, say so instead of ruining the pages.
  const floorBytes = await attempt(LADDER.length - 1);
  if (floorBytes.length > targetBytes) return { bytes: floorBytes, hit: false, level: 'floor' };
  best = floorBytes; bestIdx = LADDER.length - 1; hi = LADDER.length - 2;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const b = await attempt(mid);
    if (b.length <= targetBytes) { best = b; bestIdx = mid; hi = mid - 1; } else lo = mid + 1;
  }
  return { bytes: best, hit: true, level: bestIdx, step: LADDER[bestIdx] };
}
