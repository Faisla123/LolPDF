import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { loadBitmap, dims, drawCanvas, encode, MIME, EXT } from '../lib/images.js';
import { eachFile } from '../lib/batch.js';
import { baseName } from '../lib/format.js';

export default function ConvertImageTool({ tool }) {
  const [format, setFormat] = useState('jpg');
  const [quality, setQuality] = useState(0.92);
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bmp = await loadBitmap(file);
    const { w, h } = dims(bmp);
    const mime = MIME[format];
    const blob = await encode(drawCanvas(bmp, w, h, mime === 'image/jpeg' ? '#ffffff' : null), mime, Number(quality));
    bmp.close?.();
    return { name: `${baseName(file.name)}.${EXT[blob.type]}`, blob, compare: false };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add your images.', 'Pick the format you need.', 'Press Convert and download.']}>
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        inspect={false}
        runLabel="Convert images"
        options={() => (
          <>
            <Field label="Convert to"><Segmented label="Format" value={format} onChange={setFormat} options={[{ value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WebP' }]} /></Field>
            {format !== 'png' && <Field label={`Quality ${Math.round(quality * 100)}%`}><input type="range" min="0.4" max="1" step="0.01" value={quality} onChange={(e) => setQuality(e.target.value)} /></Field>}
            {format === 'jpg' && <p className="muted small">Transparent areas become white in JPG.</p>}
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
