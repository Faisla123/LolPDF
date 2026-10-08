import { useEffect, useRef, useState } from 'react';
import Segmented from './Segmented.jsx';

function trim(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const d = ctx.getImageData(0, 0, width, height).data;
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (d[(y * width + x) * 4 + 3] > 10) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  if (x1 <= x0 || y1 <= y0) return null;
  const pad = 6;
  const c = document.createElement('canvas');
  c.width = x1 - x0 + pad * 2;
  c.height = y1 - y0 + pad * 2;
  c.getContext('2d').drawImage(canvas, x0, y0, x1 - x0, y1 - y0, pad, pad, x1 - x0, y1 - y0);
  return { url: c.toDataURL('image/png'), w: c.width, h: c.height };
}

const FONTS = [
  ['Script', '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive'],
  ['Classic', '"Palatino Linotype", Georgia, serif'],
];

export default function SignaturePad({ onChange }) {
  const [tab, setTab] = useState('draw');
  const [text, setText] = useState('');
  const [font, setFont] = useState(0);
  const [color, setColor] = useState('#1a1a2e');
  const pad = useRef(null);
  const drawing = useRef(false);

  const emit = () => onChange(trim(pad.current));

  const clear = () => {
    const c = pad.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    onChange(null);
  };

  useEffect(() => {
    if (tab !== 'type') return;
    const c = pad.current;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (text.trim()) {
      ctx.fillStyle = color;
      ctx.font = `italic 78px ${FONTS[font][1]}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 24, c.height / 2, c.width - 48);
    }
    emit();
  }, [tab, text, font, color]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e) => {
    const r = pad.current.getBoundingClientRect();
    return [((e.clientX - r.left) * pad.current.width) / r.width, ((e.clientY - r.top) * pad.current.height) / r.height];
  };
  const down = (e) => {
    if (tab !== 'draw') return;
    drawing.current = true;
    pad.current.setPointerCapture(e.pointerId);
    const ctx = pad.current.getContext('2d');
    const [x, y] = pos(e);
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke();
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = pad.current.getContext('2d');
    const [x, y] = pos(e);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const up = () => { if (drawing.current) { drawing.current = false; emit(); } };

  return (
    <div className="sigpad">
      <Segmented label="Signature type" value={tab} onChange={(v) => { setTab(v); clear(); }} options={[{ value: 'draw', label: 'Draw' }, { value: 'type', label: 'Type' }]} />
      {tab === 'type' && (
        <div className="sig-type">
          <input type="text" className="input" placeholder="Type your name" value={text} onChange={(e) => setText(e.target.value)} maxLength={40} />
          <select className="input" value={font} onChange={(e) => setFont(Number(e.target.value))}>{FONTS.map((f, i) => <option key={f[0]} value={i}>{f[0]}</option>)}</select>
        </div>
      )}
      <canvas ref={pad} width={640} height={200} className="sig-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} aria-label="Signature area" />
      <div className="sig-actions">
        <div className="swatches">
          {['#1a1a2e', '#1f3fbf', '#b00020'].map((c) => <button key={c} type="button" aria-label={`Ink ${c}`} className={color === c ? 'is-on' : ''} style={{ background: c }} onClick={() => setColor(c)} />)}
        </div>
        <button type="button" className="link-btn" onClick={clear}>Clear</button>
      </div>
    </div>
  );
}
