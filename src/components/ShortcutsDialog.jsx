export default function ShortcutsDialog({ open, onClose }) {
  if (!open) return null;
  const rows = [
    [['Ctrl', 'K'], 'Search and jump to any tool'],
    [['/'], 'Open search'],
    [['?'], 'Show this list'],
    [['Ctrl', 'Enter'], 'Run the current tool'],
    [['Ctrl', 'V'], 'Paste an image on image tools'],
    [['Esc'], 'Close dialogs'],
  ];
  return (
    <div className="overlay" onMouseDown={onClose} role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Keyboard shortcuts</h3>
        <ul className="shortcut-list">
          {rows.map(([keys, label]) => (
            <li key={label}><span>{keys.map((k, i) => <span key={k}>{i > 0 && ' + '}<kbd>{k}</kbd></span>)}</span><em>{label}</em></li>
          ))}
        </ul>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
