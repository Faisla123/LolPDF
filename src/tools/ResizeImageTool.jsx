import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { loadBitmap, dims, drawCanvas, encode, mimeForFile, EXT } from '../lib/images.js';
import { eachFile } from '../lib/batch.js';
import { baseName } from '../lib/format.js';

const PRESETS = [
  ['Instagram square', 1080, 1080],
  ['WhatsApp profile', 500, 500],
  ['Passport 35x45 mm', 413, 531],
  ['Full HD wide', 1920, 1080],
  ['Thumbnail', 300, 300],
];

export default function ResizeImageTool({ tool }) {
  const [mode, setMode] = useState('percent');
  const [pct, setPct] = useState(50);
  const [w, setW] = useState(1280);
  const [h, setH] = useState(720);
  const [lock, setLock] = useState(true);
  const [fit, setFit] = useState('contain');

  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bmp = await loadBitmap(file);
    const { w: ow, h: oh } = dims(bmp);
    let tw, th;
    if (mode === 'percent') { tw = ow * (Number(pct) / 100); th = oh * (Number(pct) / 100); }
    else if (lock && mode === 'pixels') { tw = Number(w); th = (oh * tw) / ow; if (!tw) throw new Error('Type a width.'); }
    else { tw = Number(w); th = Number(h); }
    if (!(tw >= 1 && th >= 1) || tw * th > 60_000_000) throw new Error('That size is not possible. Try something between 1 px and 8000 px.');
    const mime = mimeForFile(file);
    let canvas;
    if (mode === 'pixels' && !lock || mode === 'preset') {
      canvas = document.createElement('canvas');
      canvas.width = Math.round(tw); canvas.height = Math.round(th);
      const ctx2 = canvas.getContext('2d');
      ctx2.imageSmoothingQuality = 'high';
      if (mime === 'image/jpeg') { ctx2.fillStyle = '#fff'; ctx2.fillRect(0, 0, canvas.width, canvas.height); }
      const k = fit === 'cover' ? Math.max(tw / ow, th / oh) : Math.min(tw / ow, th / oh);
      const dw = ow * k, dh = oh * k;
      ctx2.drawImage(bmp, (tw - dw) / 2, (th - dh) / 2, dw, dh);
    } else {
      canvas = drawCanvas(bmp, tw, th, mime === 'image/jpeg' ? '#fff' : null);
    }
    bmp.close?.();
    const blob = await encode(canvas, mime, 0.92);
    return { name: `${baseName(file.name)}-${canvas.width}x${canvas.height}.${EXT[blob.type]}`, blob, compare: false };
  });

  return (
    <ToolLayout tool={tool} howTo={['Add your images.', 'Choose a percentage, exact pixels or a ready preset.', 'Press Resize and download.']}>
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        inspect={false}
        runLabel="Resize images"
        options={() => (
          <>
            <Segmented label="Resize by" value={mode} onChange={setMode} options={[{ value: 'percent', label: 'Percent' }, { value: 'pixels', label: 'Pixels' }, { value: 'preset', label: 'Preset' }]} />
            {mode === 'percent' && <Field label={`Scale ${pct}%`}><input type="range" min="5" max="200" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>}
            {mode === 'pixels' && (
              <>
                <div className="grid-2">
                  <Field label="Width (px)"><input type="number" min="1" className="input" value={w} onChange={(e) => setW(e.target.value)} /></Field>
                  <Field label="Height (px)"><input type="number" min="1" className="input" value={h} disabled={lock} onChange={(e) => setH(e.target.value)} /></Field>
                </div>
                <label className="check"><input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> Keep the proportions</label>
              </>
            )}
            {mode === 'preset' && (
              <>
                <div className="chips small-chips">{PRESETS.map(([n, pw, ph]) => <button key={n} type="button" className={`chip ${Number(w) === pw && Number(h) === ph ? 'is-on' : ''}`} onClick={() => { setW(pw); setH(ph); }}>{n}</button>)}</div>
                <p className="muted small">{w} x {h} px</p>
                <Field label="When the shape differs"><Segmented label="Fit" value={fit} onChange={setFit} options={[{ value: 'contain', label: 'Fit inside' }, { value: 'cover', label: 'Fill and crop' }]} /></Field>
              </>
            )}
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
