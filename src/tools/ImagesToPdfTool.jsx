import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { PDFDocument } from '../lib/pdfEdit.js';
import { loadBitmap, dims, drawCanvas, fitWithin, encode } from '../lib/images.js';

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
const MARGINS = { none: 0, small: 24, large: 56 };

export default function ImagesToPdfTool({ tool }) {
  const [size, setSize] = useState('a4');
  const [margin, setMargin] = useState('small');

  const run = async (files, ctx) => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      ctx.progress(i / files.length, `Image ${i + 1} of ${files.length}`);
      const bmp = await loadBitmap(files[i]);
      const { w, h } = dims(bmp);
      const lim = fitWithin(w, h, 3200);
      const isPng = files[i].type === 'image/png';
      const canvas = drawCanvas(bmp, lim.w, lim.h, isPng ? null : '#ffffff');
      const blob = await encode(canvas, isPng ? 'image/png' : 'image/jpeg', 0.9);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const img = blob.type === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      bmp.close?.();
      let pw, ph;
      if (size === 'fit') { pw = w * 0.75; ph = h * 0.75; } else {
        [pw, ph] = SIZES[size];
        if (w > h) [pw, ph] = [ph, pw];
      }
      const m = size === 'fit' ? 0 : MARGINS[margin];
      const k = Math.min((pw - 2 * m) / img.width, (ph - 2 * m) / img.height);
      const iw = img.width * k, ih = img.height * k;
      const page = doc.addPage([pw, ph]);
      page.drawImage(img, { x: (pw - iw) / 2, y: (ph - ih) / 2, width: iw, height: ih });
    }
    doc.setProducer('');
    return [{ name: ctx.cleanName('images.pdf'), blob: new Blob([await doc.save()], { type: 'application/pdf' }), compare: false }];
  };

  return (
    <ToolLayout tool={tool} howTo={['Add your images. Paste from the clipboard works too.', 'Reorder them with the arrows.', 'Choose a page size and press Create PDF.']}>
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        orderable
        inspect={false}
        runLabel="Create PDF"
        dropLabel="Choose images or drop them here"
        options={() => (
          <>
            <Field label="Page size">
              <Segmented label="Page size" value={size} onChange={setSize} options={[{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }, { value: 'fit', label: 'Fit image' }]} />
            </Field>
            {size !== 'fit' && (
              <Field label="Margin">
                <Segmented label="Margin" value={margin} onChange={setMargin} options={[{ value: 'none', label: 'None' }, { value: 'small', label: 'Small' }, { value: 'large', label: 'Large' }]} />
              </Field>
            )}
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
