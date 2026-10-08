import { useState } from 'react';
import { Util, TextArea, Output, Segmented, Field } from './kit.jsx';

export default function JsonFormatter({ tool }) {
  const [t, setT] = useState('');
  const [mode, setMode] = useState('2');
  let out = '', err = '';
  if (t.trim()) {
    try {
      const v = JSON.parse(t);
      out = mode === 'min' ? JSON.stringify(v) : JSON.stringify(v, null, mode === 'tab' ? '\t' : Number(mode));
    } catch (e) { err = e.message; }
  }
  return (
    <Util tool={tool} howTo={['Paste JSON.', 'It is checked as you type.', 'Pick pretty or minified output and copy it.']}>
      <TextArea label="JSON" value={t} onChange={setT} rows={10} testid="json-input" />
      <Field label="Layout"><Segmented label="Layout" value={mode} onChange={setMode} options={[{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }, { value: 'min', label: 'Minified' }]} /></Field>
      {t.trim() && (err ? <p className="util-bad" data-testid="json-status">Invalid JSON: {err}</p> : <p className="util-ok" data-testid="json-status">Valid JSON</p>)}
      <Output value={out} rows={10} filename="formatted.json" mime="application/json" />
    </Util>
  );
}
