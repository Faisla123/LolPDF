import { useState } from 'react';
import { ImageTool } from './imgkit.jsx';
import { Field, Segmented } from './kit.jsx';

export function applyFilters(data, { brightness, contrast, saturation, mode }) {
  const b = (brightness / 100) * 255, c = contrast / 100 + 1, s = saturation / 100 + 1;
  const k = (259 * (c * 255 - 255 + 255)) / (255 * (259 - (c * 255 - 255)));
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], bl = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * bl;
    r = l + (r - l) * s; g = l + (g - l) * s; bl = l + (bl - l) * s;
    r = k * (r + b - 128) + 128; g = k * (g + b - 128) + 128; bl = k * (bl + b - 128) + 128;
    if (mode === 'gray') { const y = 0.299 * r + 0.587 * g + 0.114 * bl; r = g = bl = y; }
    else if (mode === 'sepia') { const nr = 0.393 * r + 0.769 * g + 0.189 * bl, ng = 0.349 * r + 0.686 * g + 0.168 * bl, nb = 0.272 * r + 0.534 * g + 0.131 * bl; r = nr; g = ng; bl = nb; }
    else if (mode === 'invert') { r = 255 - r; g = 255 - g; bl = 255 - bl; }
    data[i] = r; data[i + 1] = g; data[i + 2] = bl;
  }
}

export default function ImageFilters({ tool }) {
  const [v, setV] = useState({ brightness: 0, contrast: 0, saturation: 0 });
  const [mode, setMode] = useState('none');
  const draw = (bmp, w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    const id = ctx.getImageData(0, 0, w, h);
    applyFilters(id.data, { ...v, mode });
    ctx.putImageData(id, 0, 0);
    return c;
  };
  const slider = (k, label) => <Field label={`${label}: ${v[k]}`}><input type="range" min="-100" max="100" value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} /></Field>;
  return (
    <ImageTool tool={tool} suffix="edited" runLabel="Apply filters" draw={draw}
      howTo={['Add photos.', 'Set brightness, contrast, color or pick a look.', 'Press Apply filters.']}
      options={() => (
        <>
          <Field label="Look"><Segmented label="Look" value={mode} onChange={setMode} options={[{ value: 'none', label: 'Normal' }, { value: 'gray', label: 'Black & white' }, { value: 'sepia', label: 'Sepia' }, { value: 'invert', label: 'Invert' }]} /></Field>
          {slider('brightness', 'Brightness')}{slider('contrast', 'Contrast')}{slider('saturation', 'Color strength')}
        </>
      )} />
  );
}
