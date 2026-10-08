import { useMemo, useState } from 'react';
import { useObjectUrls } from '../hooks/useObjectUrl.js';
import Icon from './Icon.jsx';
import SizeCompare from './SizeCompare.jsx';
import { formatBytes } from '../lib/format.js';
import { downloadBlob, zipOutputs } from '../lib/download.js';

export default function ResultPanel({ outputs, errors, inputSize, notes, onReset, onBack, zipName }) {
  const [copied, setCopied] = useState(false);
  const [busyZip, setBusyZip] = useState(false);
  const total = useMemo(() => outputs.reduce((n, o) => n + o.blob.size, 0), [outputs]);
  const imgOutputs = useMemo(() => outputs.filter((o) => o.blob.type.startsWith('image/')).slice(0, 8), [outputs]);
  const imgBlobs = useMemo(() => imgOutputs.map((o) => o.blob), [imgOutputs]);
  const urls = useObjectUrls(imgBlobs);
  const previews = imgOutputs.map((o, i) => ({ name: o.name, url: urls[i], checker: o.checker })).filter((p) => p.url);

  const single = outputs.length === 1;
  const text = single ? outputs[0].text : null;
  const showCompare = outputs.length > 0 && inputSize && outputs.every((o) => o.compare === true);

  const downloadAll = async () => {
    setBusyZip(true);
    try { downloadBlob(zipName, await zipOutputs(outputs)); } finally { setBusyZip(false); }
  };

  return (
    <section className="result" aria-live="polite" data-testid="result">
      <div className="result-head">
        <span className="result-tick"><Icon name="check" size={20} strokeWidth={2.4} /></span>
        <div>
          <h3>{single ? 'Your file is ready' : `${outputs.length} files are ready`}</h3>
          <p>{single ? `${outputs[0].name} · ${formatBytes(outputs[0].blob.size)}` : `${formatBytes(total)} in total`}</p>
        </div>
      </div>

      {notes?.length > 0 && <ul className="result-notes">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
      {errors?.length > 0 && (
        <ul className="result-errors">{errors.map((e, i) => <li key={i}><b>{e.name}</b> {e.message}</li>)}</ul>
      )}

      {previews.length > 0 && (
        <div className="result-previews">
          {previews.map((p) => (
            <figure key={p.name} className={p.checker ? 'is-checker' : ''}><img src={p.url} alt={p.name} /></figure>
          ))}
        </div>
      )}

      {text !== null && text !== undefined && (
        <div className="result-text">
          <p className="muted small" data-testid="text-stats">{text.length.toLocaleString()} characters, {(text.match(/\S+/g) || []).length.toLocaleString()} words. The full text is below and in the download.</p>
          <pre data-testid="result-text">{text || 'No text found.'}</pre>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => { await navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          >
            <Icon name="copy" size={16} /> {copied ? 'Copied' : 'Copy text'}
          </button>
        </div>
      )}

      {showCompare && <SizeCompare before={inputSize} after={total} />}

      {!single && (
        <ul className="result-list">
          {outputs.map((o) => (
            <li key={o.name}>
              <span title={o.name}>{o.name}</span>
              <em>{formatBytes(o.blob.size)}</em>
              <button type="button" className="link-btn" onClick={() => downloadBlob(o.name, o.blob)}>Download</button>
            </li>
          ))}
        </ul>
      )}

      <div className="result-actions">
        {single ? (
          <button type="button" className="btn btn-primary" data-testid="download" onClick={() => downloadBlob(outputs[0].name, outputs[0].blob)}>
            <Icon name="download" size={18} /> Download
          </button>
        ) : (
          <button type="button" className="btn btn-primary" data-testid="download" disabled={busyZip} onClick={downloadAll}>
            <Icon name="download" size={18} /> {busyZip ? 'Packing...' : 'Download all as ZIP'}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onBack}>Change settings</button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>Start over</button>
      </div>
    </section>
  );
}
