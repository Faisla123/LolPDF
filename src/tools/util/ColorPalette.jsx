import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';
import { IMG_ACCEPT } from './imgkit.jsx';
import { loadBitmap, dims } from '../../lib/images.js';
import { eachFile } from '../../lib/batch.js';
import { baseName } from '../../lib/format.js';

export function palette(data, count = 8) {
  // Median-cut style: bucket colors on a 4-bit grid, then merge close buckets by popularity.
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const b = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; buckets.set(k, b);
  }
  const list = [...buckets.values()].map((b) => ({ n: b.n, c: [b.r / b.n, b.g / b.n, b.b / b.n] })).sort((a, b) => b.n - a.n);
  const out = [];
  for (const it of list) {
    if (out.every((o) => Math.hypot(o.c[0] - it.c[0], o.c[1] - it.c[1], o.c[2] - it.c[2]) > 48)) out.push(it);
    if (out.length >= count) break;
  }
  const total = list.reduce((s, x) => s + x.n, 0) || 1;
  return out.map((o) => ({ hex: `#${o.c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase(), share: Math.round((o.n / total) * 100) }));
}

export default function ColorPalette({ tool }) {
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bmp = await loadBitmap(file);
    const { w, h } = dims(bmp);
    const k = Math.min(1, 200 / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    const ctx2 = c.getContext('2d', { willReadFrequently: true }); ctx2.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
    const colors = palette(ctx2.getImageData(0, 0, c.width, c.height).data);
    const text = colors.map((x) => `${x.hex}  ${x.share}%`).join('\n');
    return { name: `${baseName(file.name)}-palette.txt`, blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), text };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add a picture.', 'Press Get colors.', 'Copy the HEX codes for your design.']}>
      <Workspace tool={tool} accept={IMG_ACCEPT} inspect={false} runLabel="Get colors" onRun={run} options={() => <p className="muted">Finds the main colors in the picture, with their share of the image, as HEX codes.</p>} />
    </ToolLayout>
  );
}
