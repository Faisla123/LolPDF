import { useState } from 'react';
import { Util, TextArea, Output } from './kit.jsx';

const words = (s) => s.match(/[A-Za-z0-9\u00C0-\u024F]+/g) || [];
const CASES = {
  upper: ['UPPER CASE', (s) => s.toUpperCase()],
  lower: ['lower case', (s) => s.toLowerCase()],
  title: ['Title Case', (s) => s.toLowerCase().replace(/(^|[\s\-(])([a-z\u00E0-\u00FF])/g, (_, a, b) => a + b.toUpperCase())],
  sentence: ['Sentence case', (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase())],
  camel: ['camelCase', (s) => words(s).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('')],
  pascal: ['PascalCase', (s) => words(s).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('')],
  snake: ['snake_case', (s) => words(s).map((w) => w.toLowerCase()).join('_')],
  kebab: ['kebab-case', (s) => words(s).map((w) => w.toLowerCase()).join('-')],
  constant: ['CONSTANT_CASE', (s) => words(s).map((w) => w.toUpperCase()).join('_')],
  toggle: ['tOGGLE cASE', (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('')],
};

export default function CaseConverter({ tool }) {
  const [t, setT] = useState('');
  const [c, setC] = useState('title');
  return (
    <Util tool={tool} howTo={['Paste your text.', 'Choose a case.', 'Copy the result.']}>
      <TextArea label="Your text" value={t} onChange={setT} rows={7} testid="case-input" />
      <div className="chips small-chips">
        {Object.entries(CASES).map(([k, [label]]) => <button key={k} type="button" className={`chip ${c === k ? 'is-on' : ''}`} onClick={() => setC(k)}>{label}</button>)}
      </div>
      <Output value={CASES[c][1](t)} rows={7} filename="converted.txt" />
    </Util>
  );
}
