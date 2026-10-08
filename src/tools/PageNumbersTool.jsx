import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Field from '../components/Field.jsx';
import Segmented from '../components/Segmented.jsx';
import { loadDoc, rgb, StandardFonts, toBlob } from '../lib/pdfEdit.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

export default function PageNumbersTool({ tool }) {
  const [pos, setPos] = useState('bottom-center');
  const [format, setFormat] = useState('n');
  const [start, setStart] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [size, setSize] = useState(11);

  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const doc = await loadDoc(file);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const total = doc.getPageCount();
    doc.getPages().forEach((page, i) => {
      if (skipFirst && i === 0) return;
      const n = Number(start) + i - (skipFirst ? 1 : 0);
      const label = format === 'n' ? `${n}` : format === 'page' ? `Page ${n}` : `${n} / ${total + Number(start) - 1 - (skipFirst ? 1 : 0)}`;
      const { width, height } = page.getSize();
      const tw = font.widthOfTextAtSize(label, Number(size));
      const [v, h] = pos.split('-');
      const x = h === 'left' ? 36 : h === 'right' ? width - 36 - tw : (width - tw) / 2;
      const y = v === 'top' ? height - 36 : 28;
      page.drawText(label, { x, y, size: Number(size), font, color: rgb(0.2, 0.2, 0.2) });
    });
    return { name: ctx.cleanName(outName(file, 'numbered')), blob: toBlob(await doc.save()) };
  });

  return (
    <ToolLayout tool={tool} howTo={['Add your PDFs.', 'Pick where the number goes and how it looks.', 'Press Add page numbers and download.']}>
      <Workspace
        tool={tool}
        runLabel="Add page numbers"
        options={() => (
          <>
            <Field label="Position">
              <select className="input" value={pos} onChange={(e) => setPos(e.target.value)}>
                <option value="bottom-center">Bottom center</option>
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="top-center">Top center</option>
                <option value="top-right">Top right</option>
                <option value="top-left">Top left</option>
              </select>
            </Field>
            <Field label="Style"><Segmented label="Style" value={format} onChange={setFormat} options={[{ value: 'n', label: '1' }, { value: 'page', label: 'Page 1' }, { value: 'of', label: '1 / 9' }]} /></Field>
            <div className="grid-2">
              <Field label="Start at"><input type="number" min="0" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="Text size"><input type="number" min="6" max="36" className="input" value={size} onChange={(e) => setSize(e.target.value)} /></Field>
            </div>
            <label className="check"><input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} /> Leave the first page without a number</label>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
