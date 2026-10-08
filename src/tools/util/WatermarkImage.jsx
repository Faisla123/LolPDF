import { useState } from 'react';
import { ImageTool } from './imgkit.jsx';
import { Field, Segmented } from './kit.jsx';

export default function WatermarkImage({ tool }) {
  const [text, setText] = useState('© Your name');
  const [pos, setPos] = useState('tile');
  const [op, setOp] = useState(40);
  const [size, setSize] = useState(5);
  const [color, setColor] = useState('#ffffff');
  const draw = (bmp, w, h) => {
    const c = drawCanvas2(bmp, w, h);
    const ctx = c.getContext('2d');
    const fs = Math.max(12, (Math.min(w, h) * size) / 100);
    ctx.font = `700 ${fs}px Inter, Arial, sans-serif`;
    ctx.globalAlpha = op / 100; ctx.fillStyle = color; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = fs / 8;
    if (pos === 'tile') {
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 7); ctx.textAlign = 'center';
      const step = fs * 3.2, tw = ctx.measureText(text).width + fs * 2, diag = Math.hypot(w, h);
      for (let y = -diag; y < diag; y += step) for (let x = -diag; x < diag; x += tw) ctx.fillText(text, x + (Math.round(y / step) % 2 ? tw / 2 : 0), y);
      ctx.restore();
    } else {
      ctx.textAlign = pos.endsWith('r') ? 'right' : pos === 'c' ? 'center' : 'left';
      const x = pos.endsWith('r') ? w - fs : pos === 'c' ? w / 2 : fs;
      const y = pos === 'c' ? h / 2 : pos.startsWith('b') ? h - fs : fs;
      ctx.fillText(text, x, y);
    }
    return c;
  };
  return (
    <ImageTool tool={tool} suffix="watermarked" runLabel="Add watermark" draw={draw}
      howTo={['Add photos.', 'Type your watermark text and pick where it goes.', 'Press Add watermark.']}
      options={() => (
        <>
          <Field label="Text"><input className="input" value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <Field label="Position"><Segmented label="Position" value={pos} onChange={setPos} options={[{ value: 'tile', label: 'Repeat' }, { value: 'c', label: 'Center' }, { value: 'br', label: 'Bottom right' }, { value: 'bl', label: 'Bottom left' }]} /></Field>
          <Field label={`Opacity: ${op}%`}><input type="range" min="10" max="100" value={op} onChange={(e) => setOp(Number(e.target.value))} /></Field>
          <Field label={`Size: ${size}%`}><input type="range" min="2" max="15" value={size} onChange={(e) => setSize(Number(e.target.value))} /></Field>
          <Field label="Color"><input type="color" className="color-input" value={color} onChange={(e) => setColor(e.target.value)} /></Field>
        </>
      )} />
  );
}
function drawCanvas2(bmp, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(bmp, 0, 0); return c; }
