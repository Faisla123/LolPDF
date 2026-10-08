import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import { openPdf } from '../lib/pdfjs.js';
import { eachFile } from '../lib/batch.js';
import { baseName } from '../lib/format.js';

export default function ExtractTextTool({ tool }) {
  const run = async (files, ctx) => {
    const notes = [];
    const res = await eachFile(files, ctx, async (file, _i, progress) => {
      const pdf = await openPdf(file);
      try {
        let text = '';
        for (let n = 1; n <= pdf.numPages; n++) {
          progress(n / pdf.numPages, `Page ${n}`);
          const page = await pdf.getPage(n);
          const content = await page.getTextContent();
          let line = '';
          let lastY = null;
          for (const item of content.items) {
            if (!('str' in item)) continue;
            const y = item.transform[5];
            if (lastY !== null && Math.abs(y - lastY) > 2) { text += `${line.trimEnd()}\n`; line = ''; }
            line += item.str + (item.hasEOL ? '\n' : '');
            lastY = y;
          }
          text += `${line.trimEnd()}\n\n`;
        }
        if (!text.trim()) notes.push(`${file.name} has no text layer. It is probably a scan, and reading scans (OCR) is not supported here.`);
        return { name: `${baseName(file.name)}.txt`, blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), text, compare: false };
      } finally { pdf.destroy(); }
    });
    return { ...res, notes };
  };
  return (
    <ToolLayout tool={tool} howTo={['Add a PDF that has selectable text.', 'Press Extract text.', 'Copy the text or download it as a .txt file.']}>
      <Workspace
        tool={tool}
        runLabel="Extract text"
        options={() => <p className="muted">Works on PDFs where you can select text. Scanned pages are pictures, so they give no text.</p>}
        onRun={run}
      />
    </ToolLayout>
  );
}
