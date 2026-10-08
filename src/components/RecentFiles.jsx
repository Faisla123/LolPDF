import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { clearHistory, getHistory } from '../lib/history.js';
import { formatBytes } from '../lib/format.js';

export default function RecentFiles() {
  const [list, setList] = useState(getHistory);
  useEffect(() => {
    const sync = () => setList(getHistory());
    window.addEventListener('toolsite-history', sync);
    return () => window.removeEventListener('toolsite-history', sync);
  }, []);
  if (!list.length) return null;
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <h2>Recent on this device</h2>
          <button type="button" className="link-btn" onClick={clearHistory}>Clear</button>
        </div>
        <ul className="recent-list">
          {list.slice(0, 6).map((h) => (
            <li key={h.id}>
              <Icon name="clock" size={16} />
              <Link to={`/${h.slug}`}>{h.tool}</Link>
              <span className="recent-name" title={h.name}>{h.files > 1 ? `${h.name} and ${h.files - 1} more` : h.name}</span>
              <em>{formatBytes(h.before)} to {formatBytes(h.after)}</em>
            </li>
          ))}
        </ul>
        <p className="muted small">Only names and sizes are remembered, in this browser. File contents are never stored.</p>
      </div>
    </section>
  );
}
