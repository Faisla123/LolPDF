import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { openPdf, renderPage, canvasToBlob } from '../lib/pdfjs.js';
import { parseRanges, flattenUnique } from '../lib/ranges.js';
import { eachFile } from '../lib/batch.js';
import { baseName, pad } from '../lib/format.js';

export default function PdfToImagesTool({ tool }) {
  const [format, setFormat] = useState('jpg');
  const [scale, setScale] = useState(2);
  const [pages, setPages] = useState('');

  const run = (files, ctx) => eachFile(files, ctx, async (file, _i, progress) => {
    const pdf = await openPdf(file);
    try {
      const idx = pages.trim() ? flattenUnique(parseRanges(pages, pdf.numPages)) : Array.from({ length: pdf.numPages }, (_, i) => i);
      const out = [];
      for (let k = 0; k < idx.length; k++) {
        progress(k / idx.length, `Page ${idx[k] + 1}`);
        const { canvas } = await renderPage(pdf, idx[k] + 1, { scale: Number(scale) });
        const blob = await canvasToBlob(canvas, format === 'png' ? 'image/png' : 'image/jpeg', 0.9);
        out.push({ name: `${baseName(file.name)}-page-${pad(idx[k] + 1, String(pdf.numPages).length)}.${format}`, blob, compare: false });
        canvas.width = canvas.height = 0;
      }
      return out;
    } finally { pdf.destroy(); }
  });

  return (
    <ToolLayout tool={tool} howTo={['Add a PDF.', 'Pick JPG or PNG and the sharpness.', 'Press Convert and download the images.']}>
      <Workspace
        tool={tool}
        runLabel="Convert to images"
        options={() => (
          <>
            <Field label="Format"><Segmented label="Format" value={format} onChange={setFormat} options={[{ value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }]} /></Field>
            <Field label="Sharpness"><Segmented label="Sharpness" value={scale} onChange={setScale} options={[{ value: 1.5, label: 'Normal' }, { value: 2, label: 'High' }, { value: 3, label: 'Max' }]} /></Field>
            <Field label="Pages (optional)" hint="Leave empty for all pages. Example: 1-3, 8">
              <input type="text" className="input" value={pages} onChange={(e) => setPages(e.target.value)} spellCheck="false" />
            </Field>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
