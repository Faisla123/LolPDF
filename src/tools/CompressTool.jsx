import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { readBytes } from '../lib/pdfjs.js';
import { compressLight, compressPreset, compressToTarget, PRESETS, FLOOR } from '../lib/compressPdf.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';
import { formatBytes } from '../lib/format.js';

const SIZES = [200, 500, 1024, 2048];

export default function CompressTool({ tool }) {
  const [mode, setMode] = useState('balanced');
  const [kb, setKb] = useState(500);

  const run = async (files, ctx) => {
    const notes = [];
    const res = await eachFile(files, ctx, async (file, _i, progress) => {
      const original = await readBytes(file);
      let bytes;
      if (mode === 'lossless') {
        progress(0.2, 'Repacking');
        bytes = await compressLight(original);
      } else if (mode === 'target') {
        const target = Math.max(10, Number(kb) || 500) * 1024;
        const r = await compressToTarget(file, target, progress);
        bytes = r.bytes;
        if (!r.hit) notes.push(`${file.name}: could not reach ${formatBytes(target)} without hurting quality. This is the smallest result that stays sharp (${formatBytes(bytes.length)}). Pages were not turned into low-quality images.`);
      } else {
        const r = await compressPreset(original, mode, progress);
        bytes = r.bytes;
        if (!r.changed) notes.push(`${file.name}: there were no large pictures to shrink, so only the file structure was repacked.`);
      }
      if (bytes.length >= original.length) {
        notes.push(`${file.name}: already well optimized, so the original is returned unchanged.`);
        bytes = original;
      }
      return { name: ctx.cleanName(outName(file, 'compressed')), blob: new Blob([bytes], { type: 'application/pdf' }), compare: true };
    });
    return { ...res, notes };
  };

  return (
    <ToolLayout tool={tool} howTo={['Add one or more PDFs.', 'Pick Balanced for the best mix, or Target size when a form asks for a limit.', 'Press Compress PDF and compare the before and after sizes.']}>
      <Workspace
        tool={tool}
        runLabel="Compress PDF"
        options={() => (
          <>
            <Segmented
              label="Compression mode"
              value={mode}
              onChange={setMode}
              options={[{ value: 'quality', label: 'Same quality' }, { value: 'balanced', label: 'Balanced' }, { value: 'small', label: 'Smaller' }, { value: 'target', label: 'Target size' }]}
            />
            {PRESETS[mode] && <p className="muted">{PRESETS[mode].note}</p>}
            {mode === 'target' && (
              <>
                <div className="chips small-chips">
                  {SIZES.map((p) => (
                    <button key={p} type="button" className={`chip ${Number(kb) === p ? 'is-on' : ''}`} onClick={() => setKb(p)}>{p >= 1024 ? `${p / 1024} MB` : `${p} KB`}</button>
                  ))}
                </div>
                <Field label="Make it smaller than (KB)" hint={`Uses the best quality that fits. It never goes below ${FLOOR.dpi} dpi pictures at ${Math.round(FLOOR.quality * 100)}% quality, and tells you if the target is out of reach.`}>
                  <input type="number" min="10" className="input" value={kb} onChange={(e) => setKb(e.target.value)} />
                </Field>
              </>
            )}
            <button type="button" className={`chip ${mode === 'lossless' ? 'is-on' : ''}`} onClick={() => setMode('lossless')}>Lossless only (no pixel changes)</button>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
