import { useState } from 'react';
import { Util, Num, Stat, Field, Segmented } from './kit.jsx';

const inr = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export function gst(amount, rate, mode) {
  const a = Number(amount) || 0, r = Number(rate) || 0;
  if (mode === 'add') { const tax = (a * r) / 100; return { net: a, tax, gross: a + tax }; }
  const net = a / (1 + r / 100); return { net, tax: a - net, gross: a };
}
export default function GstCalc({ tool }) {
  const [amount, setAmount] = useState(1000);
  const [rate, setRate] = useState(18);
  const [mode, setMode] = useState('add');
  const r = gst(amount, rate, mode);
  return (
    <Util tool={tool} howTo={['Choose whether the amount is before or after GST.', 'Pick a rate.', 'Read the tax and totals.']}>
      <Field label="Amount is"><Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'add', label: 'Without GST (add it)' }, { value: 'remove', label: 'With GST (take it out)' }]} /></Field>
      <Num label="Amount" value={amount} onChange={setAmount} min={0} />
      <div className="chips small-chips">{[0.25, 3, 5, 12, 18, 28].map((x) => <button key={x} type="button" className={`chip ${Number(rate) === x ? 'is-on' : ''}`} onClick={() => setRate(x)}>{x}%</button>)}</div>
      <Num label="GST rate (%)" value={rate} onChange={setRate} min={0} step={0.05} />
      <div className="util-stats">
        <Stat label="Price before GST" value={inr(r.net)} />
        <Stat label="GST amount" value={inr(r.tax)} big />
        <Stat label="CGST + SGST (each)" value={inr(r.tax / 2)} />
        <Stat label="Total with GST" value={inr(r.gross)} />
      </div>
    </Util>
  );
}
