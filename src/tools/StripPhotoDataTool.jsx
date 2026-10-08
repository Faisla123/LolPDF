import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import { loadBitmap, dims, drawCanvas, encode, mimeForFile, EXT } from '../lib/images.js';
import { eachFile } from '../lib/batch.js';
import { baseName } from '../lib/format.js';

export default function StripPhotoDataTool({ tool }) {
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bmp = await loadBitmap(file);
    const { w, h } = dims(bmp);
    const mime = mimeForFile(file);
    const blob = await encode(drawCanvas(bmp, w, h, mime === 'image/jpeg' ? '#fff' : null), mime, 0.95);
    bmp.close?.();
    return { name: `${baseName(file.name)}-clean.${EXT[blob.type]}`, blob };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add your photos.', 'Press Remove photo data.', 'Download copies with no GPS location or camera details.']}>
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        inspect={false}
        runLabel="Remove photo data"
        options={() => <p className="muted">Each photo is redrawn into a fresh file, which leaves out GPS location, date, phone model and any other hidden tags. The picture itself looks the same.</p>}
        onRun={run}
      />
    </ToolLayout>
  );
}
