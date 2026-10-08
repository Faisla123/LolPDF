import { useState } from 'react';
import { Util, TextArea, Output, Segmented, Field } from './kit.jsx';

export function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}
const esc = (v) => { const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export default function CsvJson({ tool }) {
  const [t, setT] = useState('');
  const [mode, setMode] = useState('c2j');
  let out = '', err = '';
  if (t.trim()) {
    try {
      if (mode === 'c2j') { const [head, ...rest] = parseCsv(t); out = JSON.stringify(rest.map((r) => Object.fromEntries(head.map((k, i) => [k, r[i] ?? '']))), null, 2); }
      else {
        const arr = JSON.parse(t); if (!Array.isArray(arr)) throw new Error('Expected a list of objects, like [{...}, {...}].');
        const keys = [...new Set(arr.flatMap((o) => Object.keys(o)))];
        out = [keys.map(esc).join(','), ...arr.map((o) => keys.map((k) => esc(o[k])).join(','))].join('\n');
      }
    } catch (e) { err = e.message; }
  }
  return (
    <Util tool={tool} howTo={['Choose a direction.', 'Paste your data. The first CSV row must be the column names.', 'Copy or download the result.']}>
      <Field label="Direction"><Segmented label="Direction" value={mode} onChange={setMode} options={[{ value: 'c2j', label: 'CSV to JSON' }, { value: 'j2c', label: 'JSON to CSV' }]} /></Field>
      <TextArea label="Input" value={t} onChange={setT} rows={8} testid="cj-input" />
      {err && <p className="util-bad">{err}</p>}
      <Output value={out} rows={8} filename={mode === 'c2j' ? 'data.json' : 'data.csv'} />
    </Util>
  );
}
