import { useState } from 'react';
import { Util, Num, Stat } from './kit.jsx';

const inr = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));

export function emi(P, annualRate, months) {
  const r = annualRate / 12 / 100;
  if (!(P > 0) || !(months > 0)) return { emi: 0, total: 0, interest: 0 };
  const e = r === 0 ? P / months : (P * r * (1 + r) ** months) / ((1 + r) ** months - 1);
  return { emi: e, total: e * months, interest: e * months - P };
}

export default function EmiCalc({ tool }) {
  const [p, setP] = useState(1000000);
  const [rate, setRate] = useState(9);
  const [yrs, setYrs] = useState(10);
  const r = emi(Number(p), Number(rate), Number(yrs) * 12);
  return (
    <Util tool={tool} howTo={['Enter the loan amount, yearly interest rate and years.', 'Read the monthly EMI and the total interest.']}>
      <div className="util-grid">
        <Num label="Loan amount" value={p} onChange={setP} min={0} />
        <Num label="Interest rate (% per year)" value={rate} onChange={setRate} min={0} step={0.05} />
        <Num label="Years" value={yrs} onChange={setYrs} min={0.5} step={0.5} />
      </div>
      <div className="util-stats">
        <Stat label="Monthly EMI" value={inr(r.emi)} big />
        <Stat label="Total interest" value={inr(r.interest)} />
        <Stat label="Total payment" value={inr(r.total)} />
      </div>
      <p className="muted">Standard reducing-balance formula. Banks may add fees, so treat this as an estimate.</p>
    </Util>
  );
}
