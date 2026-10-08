import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { loadDoc, degrees, textToPng, toBlob } from '../lib/pdfEdit.js';
import { parseRanges, flattenUnique } from '../lib/ranges.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

const COLORS = ['#888888', '#d12c2c', '#2c5fd1', '#111111'];

export default function WatermarkTool({ tool }) {
  const [text, setText] = useState('CONFIDENTIAL');
  const [color, setColor] = useState(COLORS[0]);
  const [opacity, setOpacity] = useState(0.25);
  const [layout, setLayout] = useState('diagonal');
  const [pages, setPages] = useState('');

  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    if (!text.trim()) throw new Error('Type the watermark text first.');
    const doc = await loadDoc(file);
    const png = await textToPng(text.trim(), { color });
    const img = await doc.embedPng(png.bytes);
    const idx = pages.trim() ? flattenUnique(parseRanges(pages, doc.getPageCount())) : doc.getPageIndices();
    const spots = layout === 'tiled' ? [[0.2, 0.2], [0.5, 0.2], [0.8, 0.2], [0.2, 0.5], [0.5, 0.5], [0.8, 0.5], [0.2, 0.8], [0.5, 0.8], [0.8, 0.8]] : [[0.5, 0.5]];
    const angle = layout === 'straight' ? 0 : 40;
    for (const i of idx) {
      const page = doc.getPage(i);
      const { width: pw, height: ph } = page.getSize();
      const w = layout === 'tiled' ? pw * 0.28 : pw * 0.72;
      const h = (w * img.height) / img.width;
      const rad = (angle * Math.PI) / 180;
      for (const [fx, fy] of spots) {
        const cx = pw * fx, cy = ph * fy;
        page.drawImage(img, {
          x: cx - (w / 2) * Math.cos(rad) + (h / 2) * Math.sin(rad),
          y: cy - (w / 2) * Math.sin(rad) - (h / 2) * Math.cos(rad),
          width: w, height: h, rotate: degrees(layout === 'tiled' ? 30 : angle), opacity: Number(opacity),
        });
      }
    }
    return { name: ctx.cleanName(outName(file, 'watermarked')), blob: toBlob(await doc.save()) };
  });

  return (
    <ToolLayout tool={tool} howTo={['Add your PDFs.', 'Type the watermark. Hindi and other languages work.', 'Press Add watermark and download.']}>
      <Workspace
        tool={tool}
        runLabel="Add watermark"
        options={() => (
          <>
            <Field label="Watermark text"><input type="text" className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={60} /></Field>
            <Field label="Layout"><Segmented label="Layout" value={layout} onChange={setLayout} options={[{ value: 'diagonal', label: 'Diagonal' }, { value: 'straight', label: 'Straight' }, { value: 'tiled', label: 'Tiled' }]} /></Field>
            <Field label="Color">
              <div className="swatches">
                {COLORS.map((c) => <button key={c} type="button" aria-label={`Color ${c}`} className={color === c ? 'is-on' : ''} style={{ background: c }} onClick={() => setColor(c)} />)}
              </div>
            </Field>
            <Field label={`Strength ${Math.round(opacity * 100)}%`}>
              <input type="range" min="0.08" max="0.8" step="0.02" value={opacity} onChange={(e) => setOpacity(e.target.value)} />
            </Field>
            <Field label="Pages (optional)" hint="Empty means every page.">
              <input type="text" className="input" value={pages} onChange={(e) => setPages(e.target.value)} spellCheck="false" />
            </Field>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
