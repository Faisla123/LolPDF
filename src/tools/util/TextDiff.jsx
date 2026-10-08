import { useMemo, useState } from 'react';
import { Util, TextArea, Stat } from './kit.jsx';

// Line diff using longest common subsequence. Inputs are capped so the table stays small.
export function diffLines(a, b) {
  const x = a.split('\n'), y = b.split('\n');
  const n = x.length, m = y.length;
  if (n * m > 4_000_000) return null;
  const t = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = x[i] === y[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) { out.push({ k: 'same', s: x[i] }); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) out.push({ k: 'del', s: x[i++] });
    else out.push({ k: 'add', s: y[j++] });
  }
  while (i < n) out.push({ k: 'del', s: x[i++] });
  while (j < m) out.push({ k: 'add', s: y[j++] });
  return out;
}

export default function TextDiff({ tool }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const d = useMemo(() => (a || b ? diffLines(a, b) : []), [a, b]);
  const adds = d?.filter((r) => r.k === 'add').length || 0, dels = d?.filter((r) => r.k === 'del').length || 0;
  return (
    <Util tool={tool} howTo={['Paste the original on the left and the changed text on the right.', 'Green lines were added. Red lines were removed.']}>
      <div className="util-grid">
        <TextArea label="Original" value={a} onChange={setA} rows={9} testid="diff-a" />
        <TextArea label="Changed" value={b} onChange={setB} rows={9} testid="diff-b" />
      </div>
      {d === null ? <p className="form-error">These texts are too long to compare here. Try fewer than about 2,000 lines each.</p> : (a || b) && (
        <>
          <div className="util-stats"><Stat label="Added lines" value={adds} /><Stat label="Removed lines" value={dels} /><Stat label="Identical" value={a === b ? 'Yes' : 'No'} /></div>
          <div className="util-diff" data-testid="diff-out">
            {d.map((r, i) => <div key={i} className={r.k === 'same' ? '' : r.k}>{r.k === 'add' ? '+ ' : r.k === 'del' ? '- ' : '  '}{r.s}</div>)}
          </div>
        </>
      )}
    </Util>
  );
}
