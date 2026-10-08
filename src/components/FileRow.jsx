import Icon from './Icon.jsx';
import { formatBytes, plural } from '../lib/format.js';

export default function FileRow({ entry, index, total, orderable, onMove, onRemove, disabled }) {
  const isImage = entry.file.type.startsWith('image/');
  return (
    <li className="file-row">
      <span className="file-badge">{isImage ? 'IMG' : 'PDF'}</span>
      <div className="file-meta">
        <span className="file-name" title={entry.file.name}>{entry.file.name}</span>
        <span className="file-sub">
          {formatBytes(entry.file.size)}
          {entry.pages ? ` · ${plural(entry.pages, 'page')}` : ''}
          {entry.locked ? ' · locked' : ''}
        </span>
      </div>
      {orderable && total > 1 && (
        <span className="file-order">
          <button type="button" disabled={disabled || index === 0} onClick={() => onMove(index, -1)} aria-label="Move up"><Icon name="up" size={16} /></button>
          <button type="button" disabled={disabled || index === total - 1} onClick={() => onMove(index, 1)} aria-label="Move down"><Icon name="down" size={16} /></button>
        </span>
      )}
      <button type="button" className="icon-btn" disabled={disabled} onClick={() => onRemove(entry.id)} aria-label={`Remove ${entry.file.name}`}>
        <Icon name="close" size={16} />
      </button>
    </li>
  );
}
