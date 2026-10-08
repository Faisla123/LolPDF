import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout.jsx';
import Icon from '../../components/Icon.jsx';
import Segmented from '../../components/Segmented.jsx';
import Field from '../../components/Field.jsx';
import { downloadBlob } from '../../lib/download.js';

export { Segmented, Field };

// Shell for tools that work on typed text and numbers instead of files.
export function Util({ tool, howTo, children }) {
  return (
    <ToolLayout tool={tool} notice="Everything you type stays in this browser tab. Nothing is sent anywhere." howTo={howTo}>
      <div className="util-card">{children}</div>
    </ToolLayout>
  );
}

export function TextArea({ label, value, onChange, rows = 10, placeholder, testid }) {
  return (
    <Field label={label}>
      <textarea className="input util-text" rows={rows} value={value} placeholder={placeholder} data-testid={testid} spellCheck={false} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Output({ label = 'Result', value, filename = 'result.txt', rows = 10, mime = 'text/plain;charset=utf-8' }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="util-out">
      <Field label={label}>
        <textarea className="input util-text" rows={rows} readOnly value={value} data-testid="util-output" spellCheck={false} />
      </Field>
      <div className="util-actions">
        <button type="button" className="btn btn-ghost" disabled={!value} onClick={async () => { await navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          <Icon name="copy" size={16} /> {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="btn btn-ghost" disabled={!value} onClick={() => downloadBlob(filename, new Blob([value], { type: mime }))}>
          <Icon name="download" size={16} /> Download
        </button>
      </div>
    </div>
  );
}

export function Num({ label, value, onChange, min, max, step = 'any', hint }) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" className="input" value={value} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Stat({ label, value, big }) {
  return <div className={`util-stat ${big ? 'is-big' : ''}`}><span>{label}</span><b data-testid="stat">{value}</b></div>;
}
