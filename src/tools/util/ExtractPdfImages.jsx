import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';
import { readBytes, canvasToBlob } from '../../lib/pdfjs.js';
import { listImages, bitmapOf } from '../../lib/compressPdf.js';
import { baseName } from '../../lib/format.js';

export default function ExtractPdfImages({ tool }) {
  const run = async (files, ctx) => {
    const outputs = [], errors = [], notes = [];
    for (const file of files) {
      try {
        const doc = await PDFDocument.load(await readBytes(file), { ignoreEncryption: true, updateMetadata: false });
        const imgs = listImages(doc);
        let k = 0;
        for (const img of imgs) {
          ctx.progress(k / Math.max(1, imgs.length), `Picture ${k + 1} of ${imgs.length}`);
          k++;
          const n = `${baseName(file.name)}-image-${String(k).padStart(2, '0')}`;
          if (img.kind === 'jpeg') {
            // Original JPEG bytes, untouched: no quality loss at all.
            outputs.push({ name: `${n}.jpg`, blob: new Blob([img.obj.contents], { type: 'image/jpeg' }) });
          } else {
            const bmp = await bitmapOf(img);
            if (!bmp) continue;
            const c = document.createElement('canvas'); c.width = img.w; c.height = img.h;
            c.getContext('2d').drawImage(bmp, 0, 0); bmp.close?.();
            outputs.push({ name: `${n}.png`, blob: await canvasToBlob(c, 'image/png') });
          }
        }
        if (!imgs.length) notes.push(`${file.name}: no embedded pictures found. Pages made of drawings or text have nothing to extract. Use PDF to images to turn pages into pictures.`);
      } catch (e) { errors.push({ name: file.name, message: 'could not be read.' }); }
    }
    ctx.progress(1, 'Done');
    return { outputs, errors, notes };
  };
  return (
    <ToolLayout tool={tool} howTo={['Add a PDF.', 'Press Extract images.', 'Download the pictures one by one or all as a ZIP.']}>
      <Workspace tool={tool} runLabel="Extract images" onRun={run} options={() => <p className="muted">Pulls out the original pictures stored inside the PDF. JPEG pictures come out exactly as stored, with no quality loss. Very small pictures, masks and some special formats are skipped.</p>} />
    </ToolLayout>
  );
}
