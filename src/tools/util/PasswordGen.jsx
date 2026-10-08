import { useState } from 'react';
import { Util, Output, Num } from './kit.jsx';

const SETS = { lower: 'abcdefghijkmnopqrstuvwxyz', upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ', digits: '23456789', symbols: '!@#$%^&*()-_=+[]{};:,.?' };
function rand(n) { const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; let v; do { crypto.getRandomValues(a); v = a[0]; } while (v >= lim); return v % n; }
export function makePassword(len, sets) {
  const pools = Object.keys(sets).filter((k) => sets[k]).map((k) => SETS[k]);
  if (!pools.length) return '';
  const all = pools.join('');
  const chars = pools.map((p) => p[rand(p.length)]);
  while (chars.length < len) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = rand(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.slice(0, len).join('');
}

export default function PasswordGen({ tool }) {
  const [len, setLen] = useState(16);
  const [sets, setSets] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [count, setCount] = useState(1);
  const [seed, setSeed] = useState(0);
  const L = Math.min(128, Math.max(Math.max(4, Object.values(sets).filter(Boolean).length), Number(len) || 16));
  const list = Array.from({ length: Math.min(20, Math.max(1, Number(count) || 1)) }, () => makePassword(L, sets)).join('\n');
  const pool = Object.keys(sets).filter((k) => sets[k]).reduce((n, k) => n + SETS[k].length, 0);
  const bits = pool ? Math.round(L * Math.log2(pool)) : 0;
  return (
    <Util tool={tool} howTo={['Pick a length and the kinds of characters.', 'Press New password for another one.', 'Copy it into your password manager.']}>
      <div className="util-grid">
        <Num label={`Length: ${L}`} value={len} onChange={setLen} min={4} max={128} step={1} />
        <Num label="How many" value={count} onChange={setCount} min={1} max={20} step={1} />
      </div>
      <div>{Object.keys(SETS).map((k) => <label key={k} className="chip-check"><input type="checkbox" checked={sets[k]} onChange={(e) => setSets({ ...sets, [k]: e.target.checked })} /> {k}</label>)}</div>
      <p className="muted">Strength about {bits} bits. Made with your browser's secure random generator; nothing is saved or sent. (Look-alike characters such as 0, O, l and 1 are left out.)</p>
      <div key={seed}><Output label="Password" value={list} rows={Math.min(8, Math.max(2, Number(count) || 1))} filename="passwords.txt" /></div>
      <button type="button" className="btn btn-primary" onClick={() => setSeed(seed + 1)}>New password</button>
    </Util>
  );
}
