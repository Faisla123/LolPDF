import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import ToolLayout from '../components/ToolLayout.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import Icon from '../components/Icon.jsx';
import { downloadBlob } from '../lib/download.js';

const esc = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');

export default function QrCodeTool({ tool }) {
  const [type, setType] = useState('link');
  const [link, setLink] = useState('https://');
  const [wifi, setWifi] = useState({ ssid: '', pass: '', sec: 'WPA' });
  const [upi, setUpi] = useState({ pa: '', pn: '', am: '', tn: '' });
  const [fg, setFg] = useState('#111111');
  const [bg, setBg] = useState('#ffffff');
  const [level, setLevel] = useState('M');
  const [png, setPng] = useState('');

  const data = useMemo(() => {
    if (type === 'link') return link.trim() === 'https://' ? '' : link.trim();
    if (type === 'wifi') return wifi.ssid ? `WIFI:T:${wifi.sec};S:${esc(wifi.ssid)};P:${esc(wifi.pass)};;` : '';
    if (!upi.pa) return '';
    const q = new URLSearchParams({ pa: upi.pa, pn: upi.pn || upi.pa, cu: 'INR' });
    if (upi.am) q.set('am', upi.am);
    if (upi.tn) q.set('tn', upi.tn);
    return `upi://pay?${q.toString()}`;
  }, [type, link, wifi, upi]);

  useEffect(() => {
    if (!data) { setPng(''); return; }
    QRCode.toDataURL(data, { width: 720, margin: 2, errorCorrectionLevel: level, color: { dark: fg, light: bg } }).then(setPng).catch(() => setPng(''));
  }, [data, fg, bg, level]);

  const dlPng = async () => downloadBlob('qr-code.png', await (await fetch(png)).blob());
  const dlSvg = async () => {
    const svg = await QRCode.toString(data, { type: 'svg', margin: 2, errorCorrectionLevel: level, color: { dark: fg, light: bg } });
    downloadBlob('qr-code.svg', new Blob([svg], { type: 'image/svg+xml' }));
  };

  return (
    <ToolLayout tool={tool} howTo={['Choose what the code is for: a link, WiFi or UPI payment.', 'Fill in the details. The code updates as you type.', 'Download it as PNG or SVG.']}>
      <div className="workspace">
        <div className="ws-main">
          <div className="ws-card">
            <Segmented label="QR type" value={type} onChange={setType} options={[{ value: 'link', label: 'Link or text' }, { value: 'wifi', label: 'WiFi' }, { value: 'upi', label: 'UPI payment' }]} />
            {type === 'link' && <Field label="Link or text"><input type="text" className="input" value={link} onChange={(e) => setLink(e.target.value)} /></Field>}
            {type === 'wifi' && (
              <>
                <Field label="Network name"><input type="text" className="input" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} /></Field>
                <Field label="Password"><input type="text" className="input" value={wifi.pass} onChange={(e) => setWifi({ ...wifi, pass: e.target.value })} /></Field>
                <Field label="Security"><Segmented label="Security" value={wifi.sec} onChange={(v) => setWifi({ ...wifi, sec: v })} options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'nopass', label: 'Open' }]} /></Field>
              </>
            )}
            {type === 'upi' && (
              <>
                <Field label="UPI ID" hint="Example: name@bank"><input type="text" className="input" value={upi.pa} onChange={(e) => setUpi({ ...upi, pa: e.target.value })} /></Field>
                <div className="grid-2">
                  <Field label="Payee name"><input type="text" className="input" value={upi.pn} onChange={(e) => setUpi({ ...upi, pn: e.target.value })} /></Field>
                  <Field label="Amount (optional)"><input type="number" min="0" className="input" value={upi.am} onChange={(e) => setUpi({ ...upi, am: e.target.value })} /></Field>
                </div>
                <Field label="Note (optional)"><input type="text" className="input" value={upi.tn} onChange={(e) => setUpi({ ...upi, tn: e.target.value })} /></Field>
              </>
            )}
            <div className="grid-2">
              <Field label="Code color"><input type="color" className="color-input" value={fg} onChange={(e) => setFg(e.target.value)} /></Field>
              <Field label="Background"><input type="color" className="color-input" value={bg} onChange={(e) => setBg(e.target.value)} /></Field>
            </div>
            <Field label="Error correction" hint="Higher survives scratches and logos better, but looks denser.">
              <Segmented label="Error correction" value={level} onChange={setLevel} options={[{ value: 'L', label: 'Low' }, { value: 'M', label: 'Medium' }, { value: 'Q', label: 'High' }, { value: 'H', label: 'Max' }]} />
            </Field>
          </div>
        </div>
        <aside className="ws-side">
          <div className="ws-card qr-card">
            <div className="qr-preview">{png ? <img src={png} alt="Your QR code" /> : <span className="muted">Your code appears here</span>}</div>
            <div className="result-actions">
              <button type="button" className="btn btn-primary" disabled={!png} onClick={dlPng}><Icon name="download" size={18} /> PNG</button>
              <button type="button" className="btn btn-ghost" disabled={!png} onClick={dlSvg}>SVG</button>
            </div>
            <p className="muted small">Test the code with your phone camera before printing.</p>
          </div>
        </aside>
      </div>
    </ToolLayout>
  );
}
