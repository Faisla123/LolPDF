import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { loadDoc, degrees, toBlob } from '../lib/pdfEdit.js';
import { parseRanges, flattenUnique } from '../lib/ranges.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

export default function RotateTool({ tool }) {
  const [angle, setAngle] = useState(90);
  const [scope, setScope] = useState('all');
  const [custom, setCustom] = useState('1');

  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const doc = await loadDoc(file);
    const total = doc.getPageCount();
    let idx = doc.getPageIndices();
    if (scope === 'odd') idx = idx.filter((i) => i % 2 === 0);
    if (scope === 'even') idx = idx.filter((i) => i % 2 === 1);
    if (scope === 'custom') idx = flattenUnique(parseRanges(custom, total));
    idx.forEach((i) => {
      const page = doc.getPage(i);
      page.setRotation(degrees(((page.getRotation().angle + Number(angle)) % 360 + 360) % 360));
    });
    return { name: ctx.cleanName(outName(file, 'rotated')), blob: toBlob(await doc.save()) };
  });

  return (
    <ToolLayout tool={tool} howTo={['Add one or more PDFs.', 'Choose the angle and which pages to turn.', 'Press Rotate PDF and download.']}>
      <Workspace
        tool={tool}
        runLabel="Rotate PDF"
        options={() => (
          <>
            <Field label="Turn">
              <Segmented label="Angle" value={angle} onChange={setAngle} options={[{ value: 90, label: '90° right' }, { value: 180, label: '180°' }, { value: 270, label: '90° left' }]} />
            </Field>
            <Field label="Pages">
              <Segmented label="Pages" value={scope} onChange={setScope} options={[{ value: 'all', label: 'All' }, { value: 'odd', label: 'Odd' }, { value: 'even', label: 'Even' }, { value: 'custom', label: 'Chosen' }]} />
            </Field>
            {scope === 'custom' && (
              <Field label="Page list" hint="Example: 1-3, 8">
                <input type="text" className="input" value={custom} onChange={(e) => setCustom(e.target.value)} spellCheck="false" />
              </Field>
            )}
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
