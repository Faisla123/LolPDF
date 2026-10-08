import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Field from '../components/Field.jsx';
import { loadDoc, toBlob } from '../lib/pdfEdit.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

const MM = 2.83465;

export default function CropTool({ tool }) {
  const [m, setM] = useState({ top: 10, right: 10, bottom: 10, left: 10 });
  const set = (k) => (e) => setM((cur) => ({ ...cur, [k]: e.target.value }));

  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const doc = await loadDoc(file);
    const t = Number(m.top) * MM, r = Number(m.right) * MM, b = Number(m.bottom) * MM, l = Number(m.left) * MM;
    for (const page of doc.getPages()) {
      const box = page.getMediaBox();
      const w = box.width - l - r;
      const h = box.height - t - b;
      if (w < 20 || h < 20) throw new Error('The margins are bigger than the page. Lower the values.');
      page.setCropBox(box.x + l, box.y + b, w, h);
      page.setMediaBox(box.x + l, box.y + b, w, h);
    }
    return { name: ctx.cleanName(outName(file, 'cropped')), blob: toBlob(await doc.save()) };
  });

  return (
    <ToolLayout tool={tool} howTo={['Add your PDFs.', 'Enter how many millimetres to trim from each side.', 'Press Crop PDF and download.']}>
      <Workspace
        tool={tool}
        runLabel="Crop PDF"
        options={() => (
          <div className="grid-2">
            {['top', 'bottom', 'left', 'right'].map((k) => (
              <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} (mm)`}>
                <input type="number" min="0" max="200" className="input" value={m[k]} onChange={set(k)} />
              </Field>
            ))}
          </div>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
