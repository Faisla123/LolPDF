import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';
import { loadBitmap, dims, drawCanvas, encode, mimeForFile, EXT } from '../../lib/images.js';
import { eachFile } from '../../lib/batch.js';
import { baseName } from '../../lib/format.js';

export const IMG_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp';

// Shared shell for image tools: loads each file, lets draw(bitmap, w, h) return a canvas, saves in the same format.
export function ImageTool({ tool, howTo, runLabel, options, suffix, draw, outMime, accept = IMG_ACCEPT, notice }) {
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bmp = await loadBitmap(file);
    const { w, h } = dims(bmp);
    const canvas = await draw(bmp, w, h, file);
    bmp.close?.();
    const mime = outMime || mimeForFile(file);
    const blob = await encode(canvas, mime, 0.95);
    canvas.width = canvas.height = 0;
    return { name: `${baseName(file.name)}-${suffix}.${EXT[blob.type] || 'jpg'}`, blob };
  });
  return (
    <ToolLayout tool={tool} howTo={howTo} notice={notice}>
      <Workspace tool={tool} accept={accept} inspect={false} runLabel={runLabel} options={options} onRun={run} />
    </ToolLayout>
  );
}
