import JSZip from 'jszip';
import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';
import { MIME } from '../../lib/images.js';

export default function Unzip({ tool }) {
  const run = async (files, ctx) => {
    const outputs = [], errors = [];
    for (const f of files) {
      try {
        const zip = await JSZip.loadAsync(f);
        const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir && !n.startsWith('__MACOSX/'));
        let k = 0;
        for (const n of names) {
          ctx.progress(k++ / names.length, n);
          const ext = n.split('.').pop().toLowerCase();
          const data = await zip.files[n].async('blob');
          outputs.push({ name: n.split('/').pop(), blob: new Blob([data], { type: MIME[ext] || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream') }) });
        }
      } catch { errors.push({ name: f.name, message: 'is not a valid ZIP file, or is password protected.' }); }
    }
    return { outputs, errors };
  };
  return (
    <ToolLayout tool={tool} howTo={['Add a ZIP file.', 'Press Unzip.', 'Download files one by one, or all together.']}>
      <Workspace tool={tool} accept=".zip,application/zip,application/x-zip-compressed" preview={false} dropSub="ZIP files · stays on your device" runLabel="Unzip" onRun={run} options={() => <p className="muted">Password-protected ZIPs are not supported.</p>} />
    </ToolLayout>
  );
}
