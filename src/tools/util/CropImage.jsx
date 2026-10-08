import { useState } from 'react';
import { ImageTool } from './imgkit.jsx';
import { Field, Num } from './kit.jsx';

const RATIOS = { free: 0, '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4, '16:9': 16 / 9, '9:16': 9 / 16 };

export default function CropImage({ tool }) {
  const [ratio, setRatio] = useState('free');
  const [m, setM] = useState({ l: 0, r: 0, t: 0, b: 0 });
  const set = (k) => (v) => setM({ ...m, [k]: Math.min(90, Math.max(0, Number(v) || 0)) });
  const draw = (bmp, w, h) => {
    let x = (w * m.l) / 100, y = (h * m.t) / 100;
    let cw = w - x - (w * m.r) / 100, ch = h - y - (h * m.b) / 100;
    if (cw < 4 || ch < 4) throw new Error('The crop is too small. Reduce the margins.');
    const r = RATIOS[ratio];
    if (r) { if (cw / ch > r) { const nw = ch * r; x += (cw - nw) / 2; cw = nw; } else { const nh = cw / r; y += (ch - nh) / 2; ch = nh; } }
    const c = document.createElement('canvas');
    c.width = Math.round(cw); c.height = Math.round(ch);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, x, y, cw, ch, 0, 0, c.width, c.height);
    return c;
  };
  return (
    <ImageTool tool={tool} suffix="cropped" runLabel="Crop image" draw={draw}
      howTo={['Add a photo.', 'Trim each side by a percentage, and pick a shape if you need one.', 'Press Crop image.']}
      options={() => (
        <>
          <Field label="Shape (centered)"><div className="chips small-chips">{Object.keys(RATIOS).map((k) => <button key={k} type="button" className={`chip ${ratio === k ? 'is-on' : ''}`} onClick={() => setRatio(k)}>{k === 'free' ? 'Free' : k}</button>)}</div></Field>
          <div className="util-grid">
            <Num label="Trim left (%)" value={m.l} onChange={set('l')} min={0} max={90} step={1} />
            <Num label="Trim right (%)" value={m.r} onChange={set('r')} min={0} max={90} step={1} />
            <Num label="Trim top (%)" value={m.t} onChange={set('t')} min={0} max={90} step={1} />
            <Num label="Trim bottom (%)" value={m.b} onChange={set('b')} min={0} max={90} step={1} />
          </div>
        </>
      )} />
  );
}
