import { useEffect, useState } from 'react';
import { Util, TextArea, Stat } from './kit.jsx';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export default function HashTool({ tool }) {
  const [t, setT] = useState('');
  const [h, setH] = useState({});
  useEffect(() => {
    let dead = false;
    (async () => {
      const data = new TextEncoder().encode(t);
      const r = {};
      for (const a of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) r[a] = hex(await crypto.subtle.digest(a, data));
      if (!dead) setH(r);
    })();
    return () => { dead = true; };
  }, [t]);
  return (
    <Util tool={tool} howTo={['Type or paste text.', 'Copy the hash you need.']}>
      <TextArea label="Text to hash" value={t} onChange={setT} rows={5} testid="hash-input" />
      <div className="util-stats" style={{ gridTemplateColumns: '1fr' }}>
        {Object.entries(h).map(([k, v]) => <Stat key={k} label={k} value={v} />)}
      </div>
    </Util>
  );
}
