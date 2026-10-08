import { useState } from 'react';
import { Util, TextArea, Stat } from './kit.jsx';

export default function WordCounter({ tool }) {
  const [t, setT] = useState('');
  const words = (t.match(/\S+/g) || []).length;
  const sentences = (t.match(/[^.!?\n]+[.!?]+/g) || []).length || (t.trim() ? 1 : 0);
  const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const mins = words / 200;
  return (
    <Util tool={tool} howTo={['Type or paste your text.', 'Read the counts as you type.']}>
      <TextArea label="Your text" value={t} onChange={setT} rows={12} placeholder="Paste text here" testid="wc-input" />
      <div className="util-stats">
        <Stat label="Words" value={words.toLocaleString()} big />
        <Stat label="Characters" value={t.length.toLocaleString()} />
        <Stat label="No spaces" value={t.replace(/\s/g, '').length.toLocaleString()} />
        <Stat label="Sentences" value={sentences} />
        <Stat label="Paragraphs" value={paras} />
        <Stat label="Reading time" value={words ? (mins < 1 ? '< 1 min' : `${Math.round(mins)} min`) : '0 min'} />
      </div>
    </Util>
  );
}
