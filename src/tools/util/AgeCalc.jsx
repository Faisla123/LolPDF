import { useState } from 'react';
import { Util, Stat, Field } from './kit.jsx';

export function ageBetween(from, to) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  if (d < 0) { m--; d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const days = Math.floor((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);
  return { y, m, d, days };
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function AgeCalc({ tool }) {
  const [dob, setDob] = useState('');
  const [on, setOn] = useState(iso(new Date()));
  const a = dob && on && new Date(dob) <= new Date(on) ? ageBetween(new Date(`${dob}T00:00:00`), new Date(`${on}T00:00:00`)) : null;
  let next = null;
  if (dob) { const b = new Date(`${dob}T00:00:00`), t = new Date(`${on}T00:00:00`); let n = new Date(t.getFullYear(), b.getMonth(), b.getDate()); if (n < t) n = new Date(t.getFullYear() + 1, b.getMonth(), b.getDate()); next = Math.round((n - t) / 86400000); }
  return (
    <Util tool={tool} howTo={['Pick the date of birth.', 'Change "Age on" to find age on another date, such as a form deadline.']}>
      <div className="util-grid">
        <Field label="Date of birth"><input type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} data-testid="dob" /></Field>
        <Field label="Age on"><input type="date" className="input" value={on} onChange={(e) => setOn(e.target.value)} /></Field>
      </div>
      {a ? (
        <div className="util-stats">
          <Stat label="Age" value={`${a.y} years, ${a.m} months, ${a.d} days`} big />
          <Stat label="Total days" value={a.days.toLocaleString()} />
          <Stat label="Total months" value={(a.y * 12 + a.m).toLocaleString()} />
          <Stat label="Next birthday in" value={next === 0 ? 'Today!' : `${next} days`} />
        </div>
      ) : <p className="muted">{dob ? 'The birth date must be before the other date.' : 'Pick a date of birth to see the age.'}</p>}
    </Util>
  );
}
