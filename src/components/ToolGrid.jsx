import { useMemo, useState } from 'react';
import ToolCard from './ToolCard.jsx';
import { GROUPS, TOOLS } from '../data/tools.js';

export default function ToolGrid({ showFilters = true, limit }) {
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return TOOLS.filter((t) => (group === 'all' || t.group === group) && (!term || `${t.name} ${t.tagline} ${t.seo}`.toLowerCase().includes(term))).slice(0, limit || 99);
  }, [group, q, limit]);
  return (
    <div>
      {showFilters && (
        <div className="grid-controls">
          <div className="chips" role="tablist" aria-label="Tool groups">
            {GROUPS.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={group === g.id} className={`chip ${group === g.id ? 'is-on' : ''}`} onClick={() => setGroup(g.id)}>{g.label}</button>
            ))}
          </div>
          <input type="text" className="input grid-search" placeholder="Filter tools" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter tools" />
        </div>
      )}
      <div className="tool-grid">
        {list.map((t) => <ToolCard key={t.id} tool={t} />)}
        {!list.length && <p className="muted">No tool matches that. Try a word like merge, resize or QR.</p>}
      </div>
    </div>
  );
}
