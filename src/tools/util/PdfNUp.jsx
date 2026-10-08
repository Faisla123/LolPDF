import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';
import { Field, Segmented } from './kit.jsx';
import { readBytes } from '../../lib/pdfjs.js';
import { eachFile } from '../../lib/batch.js';
import { outName } from '../../lib/names.js';

const GRID = { 2: [2, 1], 4: [2, 2], 6: [3, 2], 9: [3, 3] };

export default function PdfNUp({ tool }) {
  const [per, setPer] = useState('4');
  const [border, setBorder] = useState(true);
  const run = (files, ctx) => eachFile(files, ctx, async (file, _i, progress) => {
    const src = await PDFDocument.load(await readBytes(file), { ignoreEncryption: true, updateMetadata: false });
    const out = await PDFDocument.create();
    const [cols, rows] = GRID[per];
    const landscape = per === '2' || per === '6';
    const [W, H] = landscape ? [841.89, 595.28] : [595.28, 841.89];
    const pages = await out.embedPages(src.getPages());
    const gap = 14, cw = (W - gap * (cols + 1)) / cols, ch = (H - gap * (rows + 1)) / rows;
    for (let i = 0; i < pages.length; i += cols * rows) {
      progress(i / pages.length, 'Placing pages');
      const sheet = out.addPage([W, H]);
      for (let k = 0; k < cols * rows && i + k < pages.length; k++) {
        const p = pages[i + k];
        const s = Math.min(cw / p.width, ch / p.height);
        const c = k % cols, r = Math.floor(k / cols);
        const x = gap + c * (cw + gap) + (cw - p.width * s) / 2;
        const y = H - gap - (r + 1) * ch - r * gap + (ch - p.height * s) / 2;
        sheet.drawPage(p, { x, y, width: p.width * s, height: p.height * s });
        if (border) sheet.drawRectangle({ x, y, width: p.width * s, height: p.height * s, borderWidth: 0.5, borderColor: { type: 'RGB', red: 0.6, green: 0.6, blue: 0.6 } });
      }
    }
    return { name: ctx.cleanName(outName(file, `${per}-per-sheet`)), blob: new Blob([await out.save()], { type: 'application/pdf' }) };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add a PDF.', 'Choose how many pages go on each sheet.', 'Press Combine pages. Handy for printing handouts.']}>
      <Workspace tool={tool} runLabel="Combine pages" onRun={run} options={() => (
        <>
          <Field label="Pages per sheet"><Segmented label="Pages per sheet" value={per} onChange={setPer} options={['2', '4', '6', '9'].map((v) => ({ value: v, label: v }))} /></Field>
          <label className="chip-check"><input type="checkbox" checked={border} onChange={(e) => setBorder(e.target.checked)} /> Draw a thin border around each page</label>
        </>
      )} />
    </ToolLayout>
  );
}
