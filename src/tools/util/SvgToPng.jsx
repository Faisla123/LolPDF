import { useState } from 'react';
import { ImageTool } from './imgkit.jsx';
import { Field, Segmented } from './kit.jsx';

export default function SvgToPng({ tool }) {
  const [scale, setScale] = useState('2');
  const [bg, setBg] = useState('clear');
  const draw = async (bmp, w, h) => {
    const k = Number(scale);
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const ctx = c.getContext('2d');
    if (bg === 'white') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  };
  return (
    <ImageTool tool={tool} suffix="png" outMime="image/png" accept=".svg,image/svg+xml" runLabel="Convert to PNG" draw={draw}
      howTo={['Add an SVG file.', 'Pick the size and background.', 'Press Convert to PNG.']}
      options={() => (
        <>
          <Field label="Size"><Segmented label="Size" value={scale} onChange={setScale} options={[{ value: '1', label: '1x' }, { value: '2', label: '2x' }, { value: '4', label: '4x' }]} /></Field>
          <Field label="Background"><Segmented label="Background" value={bg} onChange={setBg} options={[{ value: 'clear', label: 'Transparent' }, { value: 'white', label: 'White' }]} /></Field>
        </>
      )} />
  );
}
