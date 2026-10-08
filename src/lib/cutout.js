import { cleanAlpha, finishMatte } from './matte.js';
import { personMask, looksLikePerson } from './portrait.js';

// Background removal runs fully in the browser. The model files are fetched once, then cached.
// Fast: one general model. Best: general model, then (when the photo is of a person) a portrait model for hair and hands,
// then edge refinement against the real photo and removal of the bright fringe.
export async function cutout(file, quality, onProgress, subject = 'person') {
  const { removeBackground } = await import('@imgly/background-removal');
  const best = quality === 'best';
  const png = await removeBackground(file, {
    model: best ? 'isnet_fp16' : 'isnet_quint8',
    output: { format: 'image/png' },
    progress: (key, current, total) => {
      if (!total) return;
      const isModel = String(key).startsWith('fetch');
      onProgress?.(isModel ? 0.5 * (current / total) : 0.5 + 0.25 * (current / total), isModel ? 'Downloading tool files (first time only)' : 'Removing background');
    },
  });
  if (!best) return png;
  // the cut-out PNG has lost the colours of removed pixels, so read the colours from the original photo
  const mask = await createImageBitmap(png);
  const bmp = await createImageBitmap(file);
  if (bmp.width !== mask.width || bmp.height !== mask.height) { bmp.close?.(); mask.close?.(); return png; }
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width; canvas.height = bmp.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const mctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  mctx.canvas.width = mask.width; mctx.canvas.height = mask.height;
  mctx.drawImage(mask, 0, 0);
  const maskData = mctx.getImageData(0, 0, mask.width, mask.height).data;
  mask.close?.();
  ctx.drawImage(bmp, 0, 0);
  bmp.close?.();
  let img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const n = canvas.width * canvas.height;
  for (let i = 0; i < n; i++) img.data[i * 4 + 3] = maskData[i * 4 + 3];
  let done = false;
  try {
    if (subject !== 'person') throw new Error('object photo');
    onProgress?.(0.78, 'Finding hair and hands');
    // the portrait model needs opaque pixels as input
    const rgb = document.createElement('canvas');
    rgb.width = canvas.width; rgb.height = canvas.height;
    const rctx = rgb.getContext('2d');
    const solidImg = new ImageData(new Uint8ClampedArray(img.data), canvas.width, canvas.height);
    for (let i = 0; i < n; i++) solidImg.data[i * 4 + 3] = 255;
    rctx.putImageData(solidImg, 0, 0);
    const general = new Float32Array(n);
    for (let i = 0; i < n; i++) general[i] = img.data[i * 4 + 3] / 255;
    const person = await personMask(rgb);
    if (looksLikePerson(person, general)) {
      onProgress?.(0.92, 'Cleaning edges');
      img = finishMatte(img, person);
      done = true;
    }
  } catch (e) {
    if (subject === 'person') console.warn('Portrait pass skipped:', e?.message || e);
  }
  if (!done) {
    onProgress?.(0.92, 'Cleaning edges');
    img = cleanAlpha(img);
  }
  ctx.putImageData(img, 0, 0);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not create the image.'))), 'image/png'));
}
