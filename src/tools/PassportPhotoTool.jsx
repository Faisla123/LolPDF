import { useEffect, useRef, useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { PDFDocument } from '../lib/pdfEdit.js';
import { loadBitmap, dims } from '../lib/images.js';
import { canvasToBlob } from '../lib/pdfjs.js';
import { cutout } from '../lib/cutout.js';

const SPECS = {
  india: { label: 'India 35 x 45 mm', w: 35, h: 45 },
  us: { label: 'US 2 x 2 in', w: 50.8, h: 50.8 },
  china: { label: 'China visa 33 x 48 mm', w: 33, h: 48 },
  pan: { label: 'Stamp 25 x 35 mm', w: 25, h: 35 },
};
const SHEETS = { '4x6': [152.4, 101.6, '4x6 in photo paper'], a4: [297, 210, 'A4'] };
const DPI = 300;
const mmToPx = (mm) => Math.round((mm / 25.4) * DPI);
const MM = 2.83465;

function paint(ctx, bmp, tw, th, zoom, ox, oy, fill) {
  const { w, h } = dims(bmp);
  ctx.fillStyle = fill || '#ffffff';
  ctx.fillRect(0, 0, tw, th);
  const k = Math.max(tw / w, th / h) * zoom;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, (tw - w * k) / 2 + ox * tw, (th - h * k) / 2 + oy * th, w * k, h * k);
}

function Cropper({ file, spec, state, setState }) {
  const [bmp, setBmp] = useState(null);
  const ref = useRef(null);
  useEffect(() => { let dead = false; loadBitmap(file).then((b) => !dead && setBmp(b)); return () => { dead = true; }; }, [file]);
  useEffect(() => {
    if (!bmp || !ref.current) return;
    const c = ref.current;
    const pw = 300;
    c.width = pw; c.height = Math.round((pw * spec.h) / spec.w);
    paint(c.getContext('2d'), bmp, c.width, c.height, state.zoom, state.ox, state.oy, '#ffffff');
  }, [bmp, spec, state]);
  const drag = useRef(null);
  return (
    <div className="cropper">
      <canvas
        ref={ref}
        className="crop-canvas"
        data-cursor-label="Move"
        onPointerDown={(e) => { drag.current = [e.clientX, e.clientY, state.ox, state.oy]; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          setState((s) => ({ ...s, ox: drag.current[2] + (e.clientX - drag.current[0]) / r.width, oy: drag.current[3] + (e.clientY - drag.current[1]) / r.height }));
        }}
        onPointerUp={() => { drag.current = null; }}
      />
      <p className="muted small">Drag the photo to line up the face. Face should fill about 70 to 80 percent of the height.</p>
    </div>
  );
}

export default function PassportPhotoTool({ tool }) {
  const [specKey, setSpecKey] = useState('india');
  const [state, setState] = useState({ zoom: 1, ox: 0, oy: 0 });
  const [bg, setBg] = useState('keep');
  const [sheet, setSheet] = useState('4x6');
  const spec = SPECS[specKey];

  const run = async (files, ctx) => {
    let source = files[0];
    let fill = '#ffffff';
    if (bg !== 'keep') {
      source = await cutout(files[0], 'fast', ctx.progress);
      fill = bg === 'blue' ? '#d6e4f5' : '#ffffff';
    }
    ctx.progress(0.9, 'Building photo');
    const bmp = await loadBitmap(source);
    const tw = mmToPx(spec.w), th = mmToPx(spec.h);
    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    paint(canvas.getContext('2d'), bmp, tw, th, state.zoom, state.ox, state.oy, fill);
    bmp.close?.();
    const jpg = await canvasToBlob(canvas, 'image/jpeg', 0.95);
    const outputs = [{ name: `passport-photo-${spec.w}x${spec.h}mm.jpg`, blob: jpg, compare: false }];
    if (sheet !== 'none') {
      const [pw, ph] = SHEETS[sheet];
      const margin = 5, gap = 2;
      const fits = (W, H) => ({ cols: Math.max(0, Math.floor((W - 2 * margin + gap) / (spec.w + gap))), rows: Math.max(0, Math.floor((H - 2 * margin + gap) / (spec.h + gap))) });
      let W = pw, H = ph;
      let f = fits(W, H);
      const g = fits(H, W);
      if (g.cols * g.rows > f.cols * f.rows) { [W, H] = [H, W]; f = g; }
      if (!f.cols || !f.rows) throw new Error('The photo does not fit on that sheet.');
      const doc = await PDFDocument.create();
      const img = await doc.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
      const page = doc.addPage([W * MM, H * MM]);
      const totalW = f.cols * spec.w + (f.cols - 1) * gap, totalH = f.rows * spec.h + (f.rows - 1) * gap;
      const x0 = (W - totalW) / 2, y0 = (H - totalH) / 2;
      for (let r = 0; r < f.rows; r++) for (let c = 0; c < f.cols; c++) {
        page.drawImage(img, { x: (x0 + c * (spec.w + gap)) * MM, y: (H - y0 - (r + 1) * spec.h - r * gap) * MM, width: spec.w * MM, height: spec.h * MM });
      }
      outputs.push({ name: `passport-sheet-${sheet}-${f.cols * f.rows}-copies.pdf`, blob: new Blob([await doc.save()], { type: 'application/pdf' }), compare: false });
    }
    return { outputs, notes: sheet !== 'none' ? ['Print the sheet at 100% scale (actual size), not "fit to page".'] : [] };
  };

  return (
    <ToolLayout tool={tool} notice="Your photo stays in this tab. The optional white-background step downloads about 40-85 MB of tool files once." howTo={['Add a front-facing photo with the face in the middle.', 'Pick the photo size and drag to line up the face.', 'Press Make photo. Print the sheet at actual size.']}>
      <Workspace
        tool={tool}
        accept="image/*,.jpg,.jpeg,.png,.webp"
        multiple={false}
        inspect={false}
        runLabel="Make photo"
        options={() => (
          <>
            <Field label="Photo size">
              <select className="input" value={specKey} onChange={(e) => setSpecKey(e.target.value)}>
                {Object.entries(SPECS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label={`Zoom ${Math.round(state.zoom * 100)}%`}><input type="range" min="1" max="3" step="0.01" value={state.zoom} onChange={(e) => setState((s) => ({ ...s, zoom: Number(e.target.value) }))} /></Field>
            <Field label="Background">
              <Segmented label="Background" value={bg} onChange={setBg} options={[{ value: 'keep', label: 'Keep' }, { value: 'white', label: 'White' }, { value: 'blue', label: 'Light blue' }]} />
            </Field>
            <Field label="Print sheet">
              <Segmented label="Sheet" value={sheet} onChange={setSheet} options={[{ value: '4x6', label: '4x6 in' }, { value: 'a4', label: 'A4' }, { value: 'none', label: 'None' }]} />
            </Field>
          </>
        )}
        onRun={run}
      >
        {(entries) => <Cropper file={entries[0].file} spec={spec} state={state} setState={setState} />}
      </Workspace>
    </ToolLayout>
  );
}
