import { useState } from 'react';
import { Util, TextArea, Output, Segmented, Field } from './kit.jsx';

const enc = (s, url) => { const b = new TextEncoder().encode(s); let bin = ''; b.forEach((c) => { bin += String.fromCharCode(c); }); const r = btoa(bin); return url ? r.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : r; };
const dec = (s) => { const n = s.trim().replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(n + '='.repeat((4 - (n.length % 4)) % 4)); return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))); };

export default function Base64Tool({ tool }) {
  const [t, setT] = useState('');
  const [mode, setMode] = useState('encode');
  const [url, setUrl] = useState(false);
  let out = '', err = '';
  if (t) { try { out = mode === 'encode' ? enc(t, url) : dec(t); } catch { err = 'This is not valid Base64 text.'; } }
  return (
    <Util tool={tool} howTo={['Choose Encode or Decode.', 'Paste your text.', 'Copy the result.']}>
      <Field label="Direction"><Segmented label="Direction" value={mode} onChange={setMode} options={[{ value: 'encode', label: 'Text to Base64' }, { value: 'decode', label: 'Base64 to text' }]} /></Field>
      <TextArea label="Input" value={t} onChange={setT} rows={7} testid="b64-input" />
      {mode === 'encode' && <label className="chip-check"><input type="checkbox" checked={url} onChange={(e) => setUrl(e.target.checked)} /> URL-safe (use - and _, no padding)</label>}
      {err && <p className="util-bad">{err}</p>}
      <Output value={out} rows={7} filename="base64.txt" />
    </Util>
  );
}
