import { formatBytes } from '../lib/format.js';

export default function SizeCompare({ before, after }) {
  if (!before || !after) return null;
  const change = Math.round((1 - after / before) * 100);
  const smaller = change > 0;
  return (
    <div className="size-compare">
      <div className="sc-row">
        <span>Before</span>
        <div className="sc-bar"><i style={{ width: '100%' }} /></div>
        <b>{formatBytes(before)}</b>
      </div>
      <div className="sc-row">
        <span>After</span>
        <div className="sc-bar"><i className="is-after" style={{ width: `${Math.max(2, Math.min(100, (after / before) * 100))}%` }} /></div>
        <b>{formatBytes(after)}</b>
      </div>
      <p className={`sc-note ${smaller ? 'is-good' : ''}`}>
        {smaller ? `${change}% smaller` : change === 0 ? 'Same size' : `${Math.abs(change)}% larger`}
      </p>
    </div>
  );
}
