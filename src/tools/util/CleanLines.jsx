import { useState } from 'react';
import { Util, TextArea, Output, Field, Segmented } from './kit.jsx';

export default function CleanLines({ tool }) {
  const [t, setT] = useState('');
  const [dedupe, setDedupe] = useState(true);
  const [sort, setSort] = useState('none');
  const [trim, setTrim] = useState(true);
  const [blank, setBlank] = useState(true);
  const [ci, setCi] = useState(false);
  let lines = t ? t.split(/\r?\n/) : [];
  if (trim) lines = lines.map((l) => l.trim());
  if (blank) lines = lines.filter((l) => l !== '');
  if (dedupe) { const seen = new Set(); lines = lines.filter((l) => { const k = ci ? l.toLowerCase() : l; if (seen.has(k)) return false; seen.add(k); return true; }); }
  if (sort === 'az') lines = [...lines].sort((a, b) => a.localeCompare(b));
  if (sort === 'za') lines = [...lines].sort((a, b) => b.localeCompare(a));
  if (sort === 'len') lines = [...lines].sort((a, b) => a.length - b.length);
  if (sort === 'rev') lines = [...lines].reverse();
  const before = t ? t.split(/\r?\n/).length : 0;
  const Check = ({ v, set, label }) => <label className="chip-check"><input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {label}</label>;
  return (
    <Util tool={tool} howTo={['Paste a list, one item per line.', 'Choose what to clean.', 'Copy the cleaned list.']}>
      <TextArea label="Your list" value={t} onChange={setT} rows={9} testid="lines-input" />
      <div className="util-grid">
        <div><Check v={dedupe} set={setDedupe} label="Remove duplicate lines" /><br /><Check v={ci} set={setCi} label="Ignore upper/lower case when matching" /><br /><Check v={trim} set={setTrim} label="Trim spaces around each line" /><br /><Check v={blank} set={setBlank} label="Remove empty lines" /></div>
        <Field label="Order"><Segmented label="Order" value={sort} onChange={setSort} options={[{ value: 'none', label: 'Keep' }, { value: 'az', label: 'A-Z' }, { value: 'za', label: 'Z-A' }, { value: 'len', label: 'Short first' }, { value: 'rev', label: 'Reverse' }]} /></Field>
      </div>
      <p className="muted">{before} lines in, {lines.length} lines out.</p>
      <Output value={lines.join('\n')} rows={9} filename="cleaned-list.txt" />
    </Util>
  );
}
