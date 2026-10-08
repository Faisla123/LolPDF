import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';
import { IMG_ACCEPT } from './imgkit.jsx';
import { eachFile } from '../../lib/batch.js';
import { baseName } from '../../lib/format.js';

const toDataUrl = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Could not read the file.')); r.readAsDataURL(file); });

export default function ImageToBase64({ tool }) {
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const url = await toDataUrl(file);
    return { name: `${baseName(file.name)}-base64.txt`, blob: new Blob([url], { type: 'text/plain;charset=utf-8' }), text: url };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add an image.', 'Press Convert.', 'Copy the data URL into your HTML, CSS or code.']}>
      <Workspace tool={tool} accept={IMG_ACCEPT + ',.svg,.gif'} inspect={false} runLabel="Convert to Base64" onRun={run} options={() => <p className="muted">Gives a data URL such as data:image/png;base64,... that you can paste straight into code. Best for small images.</p>} />
    </ToolLayout>
  );
}
