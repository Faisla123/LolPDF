import JSZip from 'jszip';
import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';

export default function ZipFiles({ tool }) {
  const run = async (files, ctx) => {
    const zip = new JSZip();
    const seen = new Map();
    files.forEach((f) => { const n = seen.get(f.name) || 0; seen.set(f.name, n + 1); zip.file(n ? f.name.replace(/(\.[^.]*)?$/, `-${n + 1}$1`) : f.name, f); });
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } }, (m) => ctx.progress(m.percent / 100, 'Packing'));
    return [{ name: 'files.zip', blob }];
  };
  return (
    <ToolLayout tool={tool} howTo={['Add any files.', 'Press Create ZIP.', 'Download the single ZIP file.']}>
      <Workspace tool={tool} accept="" preview={false} maxFiles={200} dropSub="Any file type · stays on your device" runLabel="Create ZIP" onRun={run} options={() => <p className="muted">All files are packed into one ZIP in your browser.</p>} />
    </ToolLayout>
  );
}
