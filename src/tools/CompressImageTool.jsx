import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { loadBitmap, dims, drawCanvas, fitWithin, encode, encodeToTargetSafe, MIME, EXT } from '../lib/images.js';
import { eachFile } from '../lib/batch.js';
import { baseName, formatBytes } from '../lib/format.js';

const PRESETS = [20, 50, 100, 200, 500];

export default function CompressImageTool({ tool }) {
  const [mode, setMode] = useState('smart');
  const [kb, setKb] = useState(50);
  const [quality, setQuality] = useState(0.85);
  const [format, setFormat] = useState('jpg');
  const [maxDim, setMaxDim] = useState(0);

  const run = async (files, ctx) => {
    const notes = [];
    const res = await eachFile(files, ctx, async (file) => {
      const bmp = await loadBitmap(file);
      const { w, h } = dims(bmp);
      const lim = fitWithin(w, h, Number(maxDim));
      const mime = MIME[format];
      let blob;
      if (mode === 'target') {
        const target = Math.max(5, Number(kb)) * 1024;
        const r = await encodeToTargetSafe(bmp, lim.w, lim.h, mime, target);
        blob = r.blob;
        if (!r.hit) notes.push(`${file.name}: could not get under ${formatBytes(target)} without visible damage. This is the smallest result that still looks good (${formatBytes(blob.size)}).`);
        else if (r.scale < 1) notes.push(`${file.name}: the picture was also made smaller in pixels to fit the limit.`);
      } else {
        blob = await encode(drawCanvas(bmp, lim.w, lim.h, mime === 'image/jpeg' ? '#ffffff' : null), mime, mode === 'smart' ? (mime === 'image/webp' ? 0.88 : 0.9) : Number(quality));
        if (mode === 'smart' && blob.size >= file.size && lim.w === w) { blob = file; notes.push(`${file.name}: already well compressed, so it is returned unchanged.`); }
      }
      bmp.close?.();
      return { name: `${baseName(file.name)}-compressed.${blob === file ? (file.name.split('.').pop() || format) : (EXT[blob.type] || format)}`, blob, compare: true };
    });
    return { ...res, notes };
  };

  return (
    <ToolLayout tool={tool} howTo={['Add your photos. You can paste from the clipboard.', 'Choose Target size and type the limit, for example 50 KB.', 'Press Compress and download.']}>
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        inspect={false}
        runLabel="Compress images"
        options={() => (
          <>
            <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'smart', label: 'Same quality' }, { value: 'target', label: 'Target size' }, { value: 'quality', label: 'Custom' }]} />
            {mode === 'smart' ? (<p className="muted">Keeps the full size and sharpness. Only invisible extra data is removed, so the picture looks the same.</p>) : mode === 'target' ? (
              <>
                <div className="chips small-chips">{PRESETS.map((p) => <button key={p} type="button" className={`chip ${Number(kb) === p ? 'is-on' : ''}`} onClick={() => setKb(p)}>{p} KB</button>)}</div>
                <Field label="Make each image smaller than (KB)"><input type="number" min="5" className="input" value={kb} onChange={(e) => setKb(e.target.value)} /></Field>
              </>
            ) : (
              <Field label={`Quality ${Math.round(quality * 100)}%`}><input type="range" min="0.5" max="0.95" step="0.01" value={quality} onChange={(e) => setQuality(e.target.value)} /></Field>
            )}
            <Field label="Output format"><Segmented label="Format" value={format} onChange={setFormat} options={[{ value: 'jpg', label: 'JPG' }, { value: 'webp', label: 'WebP' }, { value: 'png', label: 'PNG' }]} /></Field>
            {format === 'png' && <p className="muted small">PNG is lossless, so size can only drop by shrinking the picture. JPG or WebP shrink further.</p>}
            <Field label="Longest side">
              <select className="input" value={maxDim} onChange={(e) => setMaxDim(e.target.value)}>
                <option value={0}>Keep original</option><option value={4096}>4096 px</option><option value={2048}>2048 px</option><option value={1600}>1600 px</option><option value={1280}>1280 px</option><option value={800}>800 px</option>
              </select>
            </Field>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
