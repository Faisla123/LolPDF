import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { PDFDocument, loadDoc, copyPages, toBlob } from '../lib/pdfEdit.js';
import { parseRanges, flattenUnique } from '../lib/ranges.js';
import { baseName, pad } from '../lib/format.js';

export default function SplitTool({ tool }) {
  const [mode, setMode] = useState('ranges');
  const [ranges, setRanges] = useState('1');
  const [every, setEvery] = useState(1);

  const run = async (files, ctx) => {
    const file = files[0];
    const src = await loadDoc(file);
    const total = src.getPageCount();
    const stem = baseName(file.name);
    const outputs = [];
    const save = async (indexes, label) => {
      const doc = await copyPages(src, indexes);
      doc.setProducer('');
      outputs.push({ name: ctx.cleanName(`${stem}-${label}.pdf`), blob: toBlob(await doc.save()) });
    };
    if (mode === 'ranges') {
      const groups = parseRanges(ranges, total);
      for (let i = 0; i < groups.length; i++) {
        ctx.progress(i / groups.length, `Part ${i + 1} of ${groups.length}`);
        const g = groups[i];
        await save(g, g.length > 1 ? `pages-${g[0] + 1}-${g[g.length - 1] + 1}` : `page-${g[0] + 1}`);
      }
    } else if (mode === 'every') {
      const n = Math.max(1, Number(every) || 1);
      const parts = Math.ceil(total / n);
      for (let i = 0; i < parts; i++) {
        ctx.progress(i / parts, `Part ${i + 1} of ${parts}`);
        const idx = [];
        for (let p = i * n; p < Math.min(total, (i + 1) * n); p++) idx.push(p);
        await save(idx, `part-${pad(i + 1, String(parts).length)}`);
      }
    } else if (mode === 'extract') {
      await save(flattenUnique(parseRanges(ranges, total)), 'extracted');
    } else {
      const drop = new Set(flattenUnique(parseRanges(ranges, total)));
      const keep = src.getPageIndices().filter((i) => !drop.has(i));
      if (!keep.length) throw new Error('That would remove every page. Keep at least one.');
      await save(keep, 'trimmed');
    }
    void PDFDocument;
    return outputs;
  };

  return (
    <ToolLayout tool={tool} howTo={['Add one PDF.', 'Pick how to split it and type the pages.', 'Press Split, then download the files as a ZIP.']}>
      <Workspace
        tool={tool}
        multiple={false}
        runLabel="Split PDF"
        options={() => (
          <>
            <Segmented
              label="Split mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'ranges', label: 'Ranges' },
                { value: 'every', label: 'Every N' },
                { value: 'extract', label: 'Extract' },
                { value: 'remove', label: 'Delete' },
              ]}
            />
            {mode === 'every' ? (
              <Field label="Pages per file">
                <input type="number" min="1" className="input" value={every} onChange={(e) => setEvery(e.target.value)} />
              </Field>
            ) : (
              <Field
                label={mode === 'ranges' ? 'Ranges, one file each' : mode === 'extract' ? 'Pages to keep in one file' : 'Pages to delete'}
                hint="Use commas and dashes: 1-3, 7, 9-last. You can also type odd or even."
              >
                <input type="text" className="input" value={ranges} onChange={(e) => setRanges(e.target.value)} spellCheck="false" />
              </Field>
            )}
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
