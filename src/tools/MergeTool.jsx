import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import { PDFDocument } from '../lib/pdfEdit.js';
import { readBytes } from '../lib/pdfjs.js';
import { plural } from '../lib/format.js';

export default function MergeTool({ tool }) {
  const run = async (files, ctx) => {
    const out = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      ctx.progress(i / files.length, `Adding ${files[i].name}`);
      const src = await PDFDocument.load(await readBytes(files[i]));
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    out.setProducer('');
    ctx.progress(0.95, 'Saving');
    const bytes = await out.save();
    return [{ name: ctx.cleanName('merged.pdf'), blob: new Blob([bytes], { type: 'application/pdf' }) }];
  };
  return (
    <ToolLayout tool={tool} howTo={['Add two or more PDF files.', 'Use the arrows to put them in the order you want.', 'Press Merge PDF, then download the combined file.']}>
      <Workspace
        tool={tool}
        minFiles={2}
        orderable
        runLabel="Merge PDF"
        dropLabel="Choose PDFs to merge"
        options={(entries) => (
          <p className="muted">
            {plural(entries.length, 'file')}
            {entries.every((e) => e.pages) ? `, ${plural(entries.reduce((n, e) => n + e.pages, 0), 'page')} in total` : ''}. Order top to bottom is the order in the result.
          </p>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
