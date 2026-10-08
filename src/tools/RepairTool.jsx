import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import { runQpdf } from '../lib/qpdf.js';
import { readBytes } from '../lib/pdfjs.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

export default function RepairTool({ tool }) {
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bytes = await readBytes(file);
    const { bytes: fixed, warnings } = await runQpdf(bytes, (i, o) => [i, o]);
    void warnings;
    return { name: ctx.cleanName(outName(file, 'repaired')), blob: new Blob([fixed], { type: 'application/pdf' }) };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add the PDF that will not open.', 'Press Repair PDF.', 'Download the rebuilt file and try opening it.']}>
      <Workspace
        tool={tool}
        inspect={false}
        runLabel="Repair PDF"
        options={() => <p className="muted">The file is rebuilt from whatever can be read. If the damage is too deep, the missing parts cannot be recovered.</p>}
        onRun={run}
      />
    </ToolLayout>
  );
}
