import { useState } from 'react';
import { Util, Num, Stat, Field } from './kit.jsx';

// factor = how many base units in one of this unit
const CATS = {
  Length: { base: 'm', units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344 } },
  Weight: { base: 'kg', units: { mg: 1e-6, g: 0.001, kg: 1, tonne: 1000, ounce: 0.028349523125, pound: 0.45359237, 'quintal': 100, tola: 0.01166638 } },
  Area: { base: 'm2', units: { 'sq cm': 0.0001, 'sq m': 1, 'sq km': 1e6, 'sq foot': 0.09290304, 'sq yard': 0.83612736, acre: 4046.8564224, hectare: 10000, bigha: 2529.285264 } },
  Volume: { base: 'L', units: { mL: 0.001, L: 1, 'cubic m': 1000, teaspoon: 0.00492892, tablespoon: 0.0147868, 'cup (US)': 0.2365882, 'gallon (US)': 3.785411784 } },
  Speed: { base: 'm/s', units: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, knot: 0.514444 } },
  Data: { base: 'byte', units: { byte: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 } },
  Time: { base: 's', units: { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, year: 31557600 } },
};
export function convert(v, cat, from, to) {
  if (cat === 'Temperature') {
    const c = from === 'Celsius' ? v : from === 'Fahrenheit' ? ((v - 32) * 5) / 9 : v - 273.15;
    return to === 'Celsius' ? c : to === 'Fahrenheit' ? (c * 9) / 5 + 32 : c + 273.15;
  }
  const u = CATS[cat].units;
  return (v * u[from]) / u[to];
}
const fmt = (n) => (Number.isFinite(n) ? Number(n.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 10 }) : '-');

export default function UnitConverter({ tool }) {
  const names = [...Object.keys(CATS), 'Temperature'];
  const [cat, setCat] = useState('Length');
  const unitsOf = (c) => (c === 'Temperature' ? ['Celsius', 'Fahrenheit', 'Kelvin'] : Object.keys(CATS[c].units));
  const [from, setFrom] = useState('km');
  const [to, setTo] = useState('mile');
  const [val, setVal] = useState(1);
  const pick = (c) => { setCat(c); const u = unitsOf(c); setFrom(u[Math.min(2, u.length - 1)] === u[0] ? u[0] : u[2 % u.length]); setTo(u[3 % u.length]); };
  return (
    <Util tool={tool} howTo={['Choose what you are measuring.', 'Type a number and pick the two units.']}>
      <div className="chips small-chips">{names.map((n) => <button key={n} type="button" className={`chip ${cat === n ? 'is-on' : ''}`} onClick={() => pick(n)}>{n}</button>)}</div>
      <div className="util-grid">
        <Num label="Value" value={val} onChange={setVal} />
        <Field label="From"><select className="input" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="from">{unitsOf(cat).map((u) => <option key={u}>{u}</option>)}</select></Field>
        <Field label="To"><select className="input" value={to} onChange={(e) => setTo(e.target.value)} data-testid="to">{unitsOf(cat).map((u) => <option key={u}>{u}</option>)}</select></Field>
      </div>
      <Stat label={`${fmt(Number(val))} ${from} equals`} value={`${fmt(convert(Number(val), cat, from, to))} ${to}`} big />
    </Util>
  );
}
