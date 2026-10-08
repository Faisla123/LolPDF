import { useState } from 'react';
import { ImageTool } from './imgkit.jsx';
import { Field, Segmented } from './kit.jsx';

export default function RotateFlipImage({ tool }) {
  const [rot, setRot] = useState('90');
  const [flip, setFlip] = useState('none');
  const draw = (bmp, w, h) => {
    const a = Number(rot);
    const swap = a === 90 || a === 270;
    const c = document.createElement('canvas');
    c.width = swap ? h : w; c.height = swap ? w : h;
    const ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((a * Math.PI) / 180);
    ctx.scale(flip === 'h' || flip === 'both' ? -1 : 1, flip === 'v' || flip === 'both' ? -1 : 1);
    ctx.drawImage(bmp, -w / 2, -h / 2);
    return c;
  };
  return (
    <ImageTool tool={tool} suffix="rotated" runLabel="Apply" draw={draw}
      howTo={['Add photos.', 'Pick the turn and mirror options.', 'Press Apply.']}
      options={() => (
        <>
          <Field label="Turn clockwise"><Segmented label="Turn" value={rot} onChange={setRot} options={[{ value: '0', label: '0°' }, { value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }]} /></Field>
          <Field label="Mirror"><Segmented label="Mirror" value={flip} onChange={setFlip} options={[{ value: 'none', label: 'None' }, { value: 'h', label: 'Left-right' }, { value: 'v', label: 'Up-down' }, { value: 'both', label: 'Both' }]} /></Field>
        </>
      )} />
  );
}
