import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { TOOLS, toolPath } from '../data/tools.js';

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const input = useRef(null);
  const nav = useNavigate();
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return TOOLS.filter((t) => !term || `${t.name} ${t.tagline} ${t.seo} ${t.group}`.toLowerCase().includes(term));
  }, [q]);

  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => input.current?.focus(), 20); } }, [open]);
  useEffect(() => setIdx(0), [q]);
  if (!open) return null;

  const go = (t) => { onClose(); nav(toolPath(t)); };
  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(list.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter' && list[idx]) go(list[idx]);
  };

  return (
    <div className="overlay" onMouseDown={onClose} role="presentation">
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search tools" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="palette-input">
          <Icon name="search" size={18} />
          <input ref={input} type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools, like merge or background" aria-label="Search tools" />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette-list" role="listbox">
          {list.map((t, i) => (
            <li key={t.id} role="option" aria-selected={i === idx} className={i === idx ? 'is-on' : ''} onMouseEnter={() => setIdx(i)} onClick={() => go(t)}>
              <Icon name={t.icon} size={18} />
              <span>{t.name}</span>
              <em>{t.tagline}</em>
            </li>
          ))}
          {!list.length && <li className="palette-empty">No tool found.</li>}
        </ul>
      </div>
    </div>
  );
}
