import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { cutout } from '../lib/cutout.js';
import { loadBitmap, dims, drawCanvas } from '../lib/images.js';
import { canvasToBlob } from '../lib/pdfjs.js';
import { eachFile } from '../lib/batch.js';
import { baseName } from '../lib/format.js';

export default function RemoveBackgroundTool({ tool }) {
  const [quality, setQuality] = useState('best');
  const [subject, setSubject] = useState('person');
  const [bg, setBg] = useState('transparent');
  const [color, setColor] = useState('#3b82f6');

  const run = (files, ctx) => eachFile(files, ctx, async (file, _i, progress) => {
    const png = await cutout(file, quality, progress, subject);
    let blob = png;
    let ext = 'png';
    if (bg !== 'transparent') {
      const bmp = await loadBitmap(png);
      const { w, h } = dims(bmp);
      const fill = bg === 'white' ? '#ffffff' : bg === 'black' ? '#000000' : color;
      blob = await canvasToBlob(drawCanvas(bmp, w, h, fill), 'image/png');
      bmp.close?.();
    }
    return { name: `${baseName(file.name)}-no-bg.${ext}`, blob, checker: bg === 'transparent', compare: false };
  });

  return (
    <ToolLayout
      tool={tool}
      notice="Your photo never leaves this tab. The first run downloads about 40-85 MB of tool files. Your photo is not uploaded."
      howTo={['Add a photo with a clear subject.', 'Choose a transparent or colored background.', 'Press Remove background. The first run downloads extra tool files, so allow a minute.']}
    >
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        inspect={false}
        runLabel="Remove background"
        dropLabel="Choose photos to cut out"
        options={() => (
          <>
            <Field label="Quality" hint={quality === 'fast' ? 'First download: about 40 MB. Good for most photos.' : 'First download: about 85 MB. Cleaner edges on hair, clothes and fine detail, with stray specks removed.'}>
              <Segmented label="Quality" value={quality} onChange={setQuality} options={[{ value: 'best', label: 'Best' }, { value: 'fast', label: 'Fast' }]} />
            </Field>
            {quality === 'best' && (
              <Field label="Photo of" hint={subject === 'person' ? 'Best for people: keeps hair strands and hands, and leaves out what they lean on (bike, chair). Adds a 26 MB download the first time.' : 'For products, pets, food and objects.'}>
                <Segmented label="Photo of" value={subject} onChange={setSubject} options={[{ value: 'person', label: 'A person' }, { value: 'object', label: 'Object / pet' }]} />
              </Field>
            )}
            <Field label="Background">
              <Segmented label="Background" value={bg} onChange={setBg} options={[{ value: 'transparent', label: 'Clear' }, { value: 'white', label: 'White' }, { value: 'black', label: 'Black' }, { value: 'color', label: 'Color' }]} />
            </Field>
            {bg === 'color' && <Field label="Pick a color"><input type="color" className="color-input" value={color} onChange={(e) => setColor(e.target.value)} /></Field>}
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
