import { useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function Dropzone({ accept, multiple, onFiles, label, sub, compact = false, disabled = false }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const take = (list) => {
    const files = Array.from(list || []);
    if (files.length) onFiles(files);
  };

  return (
    <div
      className={`dropzone ${over ? 'is-over' : ''} ${compact ? 'is-compact' : ''} ${disabled ? 'is-disabled' : ''}`}
      data-cursor-label={over ? 'Drop' : 'Choose'}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); input.current?.click(); } }}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        data-testid="file-input"
        onChange={(e) => { take(e.target.files); e.target.value = ''; }}
      />
      <span className="dz-icon"><Icon name="upload" size={26} /></span>
      <strong>{label}</strong>
      {sub && <span className="dz-sub">{sub}</span>}
    </div>
  );
}
