import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { PDFDocument } from '../lib/pdfEdit.js';
import { loadBitmap, dims, drawCanvas, fitWithin, encode } from '../lib/images.js';

function percentile(hist, total, p) {
  let acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * p) return i; }
  return 255;
}

function enhance(canvas, mode) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const gray = new Uint8ClampedArray(w * h);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    gray[p] = g;
    hist[g | 0]++;
  }
  const lo = percentile(hist, w * h, 0.02);
  const hi = Math.max(lo + 1, percentile(hist, w * h, 0.97));
  const stretch = (v) => Math.max(0, Math.min(255, ((v - lo) * 255) / (hi - lo)));

  if (mode === 'color') {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = stretch(d[i]); d[i + 1] = stretch(d[i + 1]); d[i + 2] = stretch(d[i + 2]);
    }
  } else if (mode === 'gray') {
    for (let p = 0, i = 0; p < gray.length; p++, i += 4) { const v = stretch(gray[p]); d[i] = d[i + 1] = d[i + 2] = v; }
  } else {
    // Black and white: compare each pixel with the average of its neighbourhood (integral image).
    const integral = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += gray[y * w + x];
        integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
      }
    }
    const r = Math.max(8, Math.round(Math.min(w, h) / 24));
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        const sum = integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] - integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0];
        const mean = sum / ((x1 - x0) * (y1 - y0));
        const v = gray[y * w + x] < mean * 0.9 ? 0 : 255;
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export default function ScanToPdfTool({ tool }) {
  const [mode, setMode] = useState('bw');
  const [size, setSize] = useState('a4');

  const run = async (files, ctx) => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      ctx.progress(i / files.length, `Cleaning page ${i + 1} of ${files.length}`);
      const bmp = await loadBitmap(files[i]);
      const { w, h } = dims(bmp);
      const lim = fitWithin(w, h, 2400);
      const canvas = drawCanvas(bmp, lim.w, lim.h, '#ffffff');
      bmp.close?.();
      await new Promise((r) => setTimeout(r, 0));
      enhance(canvas, mode);
      const blob = await encode(canvas, 'image/jpeg', mode === 'bw' ? 0.7 : 0.82);
      const img = await doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      let pw, ph;
      if (size === 'a4') { [pw, ph] = w > h ? [841.89, 595.28] : [595.28, 841.89]; } else { pw = img.width * 0.6; ph = img.height * 0.6; }
      const k = Math.min(pw / img.width, ph / img.height);
      const page = doc.addPage([pw, ph]);
      page.drawImage(img, { x: (pw - img.width * k) / 2, y: (ph - img.height * k) / 2, width: img.width * k, height: img.height * k });
    }
    doc.setProducer('');
    return [{ name: ctx.cleanName('scan.pdf'), blob: new Blob([await doc.save()], { type: 'application/pdf' }), compare: false }];
  };

  return (
    <ToolLayout tool={tool} howTo={['Take clear photos of your pages on a flat surface with good light.', 'Add them and choose a clean-up style.', 'Press Create scan and download the PDF.']}>
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        orderable
        inspect={false}
        runLabel="Create scan"
        dropLabel="Choose photos of your pages"
        options={() => (
          <>
            <Field label="Clean-up">
              <Segmented label="Clean-up" value={mode} onChange={setMode} options={[{ value: 'bw', label: 'Black & white' }, { value: 'gray', label: 'Grayscale' }, { value: 'color', label: 'Color boost' }]} />
            </Field>
            <Field label="Page">
              <Segmented label="Page" value={size} onChange={setSize} options={[{ value: 'a4', label: 'A4' }, { value: 'fit', label: 'Fit photo' }]} />
            </Field>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
