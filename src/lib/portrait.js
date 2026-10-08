// Portrait matting with MODNet (Apache-2.0, 26 MB, runs in the browser). It is trained on people, so it keeps
// hair strands and hands and leaves out the things a person leans on (a scooter, a chair). It is used only
// when the photo really is a person; other photos stay with the general model.
const MODEL_URL = '/models/modnet.onnx';
let sessionPromise = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = (await import('onnxruntime-web')).default;
      const res = await fetch(MODEL_URL);
      if (!res.ok) throw new Error('portrait model missing');
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length < 1e6) throw new Error('portrait model incomplete');
      const session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      return { ort, session };
    })().catch((e) => { sessionPromise = null; throw e; });
  }
  return sessionPromise;
}

async function runOnce(ort, session, canvas, flip) {
  const short = 512;
  const s = short / Math.min(canvas.width, canvas.height);
  const w = Math.max(32, Math.round((canvas.width * s) / 32) * 32);
  const h = Math.max(32, Math.round((canvas.height * s) / 32) * 32);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingQuality = 'high';
  if (flip) { x.translate(w, 0); x.scale(-1, 1); }
  x.drawImage(canvas, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const t = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) for (let k = 0; k < 3; k++) t[k * w * h + i] = d[i * 4 + k] / 127.5 - 1;
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', t, [1, 3, h, w]) });
  const m = out[session.outputNames[0]].data;
  const lo = new Float32Array(w * h);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) lo[yy * w + xx] = Math.min(1, Math.max(0, m[yy * w + (flip ? w - 1 - xx : xx)]));
  return { lo, w, h };
}

// Bicubic-ish smooth upscale of a small float mask to full size via a canvas (bilinear with high quality).
function upscale(lo, w, h, W, H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const im = x.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = Math.round(lo[i] * 255); im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  const big = document.createElement('canvas');
  big.width = W; big.height = H;
  const bx = big.getContext('2d', { willReadFrequently: true });
  bx.imageSmoothingQuality = 'high';
  bx.drawImage(c, 0, 0, W, H);
  const d = bx.getImageData(0, 0, W, H).data;
  const out = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = d[i * 4] / 255;
  return out;
}

// Returns a Float32Array person mask (0..1) at the canvas size. Two passes (normal + mirrored) are combined:
// where they disagree the lower value wins, which removes one-sided false blobs.
export async function personMask(canvas) {
  const { ort, session } = await getSession();
  const a = await runOnce(ort, session, canvas, false);
  const b = await runOnce(ort, session, canvas, true);
  const W = canvas.width, H = canvas.height;
  const ma = upscale(a.lo, a.w, a.h, W, H), mb = upscale(b.lo, b.w, b.h, W, H);
  const out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) out[i] = 0.25 * (ma[i] + mb[i]) + 0.5 * Math.min(ma[i], mb[i]);
  return out;
}

// True when the portrait mask is a plausible person that sits inside what the general model found.
export function looksLikePerson(person, general) {
  let pa = 0, ga = 0, both = 0;
  for (let i = 0; i < person.length; i++) {
    const p = person[i] > 0.5, g = general[i] > 0.5;
    if (p) pa++;
    if (g) ga++;
    if (p && g) both++;
  }
  if (pa < person.length * 0.02 || !ga) return false;
  return both / pa >= 0.85 && pa / ga >= 0.25;
}
