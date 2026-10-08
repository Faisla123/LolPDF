import { useCallback, useEffect, useRef, useState } from 'react';
import Dropzone from './Dropzone.jsx';
import FileRow from './FileRow.jsx';
import ResultPanel from './ResultPanel.jsx';
import Icon from './Icon.jsx';
import FilePreview from './FilePreview.jsx';
import { openPdf, isPasswordError } from '../lib/pdfjs.js';
import { cleanFileName, extOf, plural } from '../lib/format.js';
import { friendlyError } from '../lib/errors.js';
import { addHistory } from '../lib/history.js';
import { usePref } from '../hooks/usePref.js';
import { useHotkeys } from '../hooks/useHotkeys.js';

let uid = 0;

function acceptsFile(file, accept) {
  if (!accept) return true;
  const parts = accept.split(',').map((s) => s.trim().toLowerCase());
  const ext = `.${extOf(file.name)}`;
  return parts.some((p) => (p.startsWith('.') ? p === ext : p.endsWith('/*') ? file.type.startsWith(p.slice(0, -1)) : file.type === p));
}

export default function Workspace({
  tool,
  accept = '.pdf,application/pdf',
  multiple = true,
  minFiles = 1,
  maxFiles = 40,
  orderable = false,
  inspect = true,
  dropLabel,
  dropSub,
  options,
  runLabel,
  validate,
  onRun,
  allowLockedFiles = false,
  preview = true,
  children,
}) {
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: '' });
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [friendlyNames] = usePref('friendlyNames', true);
  const alive = useRef(true);
  // StrictMode runs effects twice in dev; mark alive again or every update is dropped.
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const isPdfTool = accept.includes('pdf');

  const addFiles = useCallback(async (list) => {
    setError('');
    const good = list.filter((f) => acceptsFile(f, accept));
    const skipped = list.length - good.length;
    if (skipped) setError(`${plural(skipped, 'file')} skipped: this tool needs ${isPdfTool ? 'PDF files' : 'image files'}.`);
    const room = multiple ? maxFiles : 1;
    const fresh = good.map((file) => ({ id: ++uid, file, pages: 0, locked: false }));
    setResult(null);
    setEntries((cur) => (multiple ? [...cur, ...fresh].slice(0, room) : fresh.slice(0, 1)));
    if (inspect && isPdfTool) {
      for (const e of fresh) {
        try {
          const pdf = await openPdf(e.file);
          const pages = pdf.numPages;
          pdf.destroy();
          if (alive.current) setEntries((cur) => cur.map((x) => (x.id === e.id ? { ...x, pages } : x)));
        } catch (err) {
          if (isPasswordError(err) && alive.current) setEntries((cur) => cur.map((x) => (x.id === e.id ? { ...x, locked: true } : x)));
          else if (alive.current) setEntries((cur) => cur.map((x) => (x.id === e.id ? { ...x, broken: true } : x)));
        }
      }
    }
  }, [accept, isPdfTool, multiple, maxFiles, inspect]);

  // Paste images straight from the clipboard on image tools.
  useEffect(() => {
    if (isPdfTool) return undefined;
    const onPaste = (e) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles, isPdfTool]);

  const move = (i, dir) => setEntries((cur) => {
    const next = cur.slice();
    const j = i + dir;
    if (j < 0 || j >= next.length) return cur;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const remove = (id) => { setResult(null); setEntries((cur) => cur.filter((e) => e.id !== id)); };
  const reset = () => { setEntries([]); setResult(null); setError(''); setProgress({ value: 0, label: '' }); };

  const run = async () => {
    if (busy) return;
    setError('');
    if (entries.length < minFiles) { setError(minFiles > 1 ? `Add at least ${minFiles} files.` : 'Add a file first.'); return; }
    if (!allowLockedFiles && entries.some((e) => e.locked)) { setError('One of these PDFs is locked. Use Unlock PDF first, then come back.'); return; }
    const problem = validate?.(entries);
    if (problem) { setError(problem); return; }
    setBusy(true);
    setProgress({ value: 0.02, label: 'Starting' });
    const t0 = performance.now();
    try {
      const ctx = {
        progress: (value, label = '') => alive.current && setProgress({ value: Math.max(0, Math.min(1, value)), label }),
        cleanName: (name) => cleanFileName(name, friendlyNames),
        entries,
      };
      const out = await onRun(entries.map((e) => e.file), ctx, entries);
      const outputs = (out.outputs || out).map((o) => ({ ...o, name: cleanFileName(o.name, friendlyNames) }));
      if (!outputs.length) throw new Error(out.errors?.[0]?.message || 'Nothing came out. Check the settings and try again.');
      const inputSize = entries.reduce((n, e) => n + e.file.size, 0);
      if (alive.current) {
        setResult({ outputs, errors: out.errors || [], notes: out.notes || [], inputSize, took: performance.now() - t0 });
        addHistory({ tool: tool.name, slug: tool.slug, files: entries.length, name: entries[0].file.name, before: inputSize, after: outputs.reduce((n, o) => n + o.blob.size, 0) });
      }
    } catch (err) {
      if (alive.current) setError(friendlyError(err));
    } finally {
      if (alive.current) { setBusy(false); setProgress({ value: 0, label: '' }); }
    }
  };

  useHotkeys({ 'mod+enter': () => { if (!result) run(); } });

  const showOptions = typeof options === 'function' ? options(entries, busy) : options;
  const hasFiles = entries.length > 0;

  if (result) {
    return (
      <ResultPanel
        outputs={result.outputs}
        errors={result.errors}
        notes={result.notes}
        inputSize={result.inputSize}
        zipName={cleanFileName(`${tool.slug}.zip`, friendlyNames)}
        onBack={() => setResult(null)}
        onReset={reset}
      />
    );
  }

  return (
    <div className="workspace">
      <div className="ws-main">
        {(!hasFiles || multiple) && (
          <Dropzone
            accept={accept}
            multiple={multiple}
            onFiles={addFiles}
            compact={hasFiles}
            disabled={busy}
            label={hasFiles ? (multiple ? 'Add more files' : 'Choose a different file') : dropLabel || (multiple ? 'Choose files or drop them here' : 'Choose a file or drop it here')}
            sub={hasFiles ? null : dropSub || (isPdfTool ? 'PDF files · stays on your device' : 'JPG, PNG, WebP · stays on your device')}
          />
        )}
        {hasFiles && !multiple && (
          <ul className="file-list">
            <FileRow entry={entries[0]} index={0} total={1} onRemove={remove} disabled={busy} />
          </ul>
        )}
        {hasFiles && multiple && (
          <ul className="file-list">
            {entries.map((e, i) => (
              <FileRow key={e.id} entry={e} index={i} total={entries.length} orderable={orderable} onMove={move} onRemove={remove} disabled={busy} />
            ))}
          </ul>
        )}
        {hasFiles && preview && <FilePreview entries={entries} />}
        {hasFiles && typeof children === 'function' ? children(entries, busy) : hasFiles ? children : null}
      </div>

      <aside className="ws-side">
        <div className="ws-card">
          <h2 className="ws-title">Settings</h2>
          {hasFiles ? showOptions : <p className="muted">Add a file to see the options.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {busy && (
            <div className="progress" role="progressbar" aria-valuenow={Math.round(progress.value * 100)} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${progress.value * 100}%` }} />
              <span>{progress.label || 'Working'}</span>
            </div>
          )}
          <button type="button" className="btn btn-primary btn-block" data-testid="run" disabled={busy || !hasFiles} onClick={run}>
            {busy ? 'Working...' : <>{runLabel || tool.name} <Icon name="arrow" size={18} /></>}
          </button>
          <p className="kbd-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run</p>
        </div>
      </aside>
    </div>
  );
}
