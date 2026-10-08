import { useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import ToolLayout from '../../components/ToolLayout.jsx';
import { Util, TextArea, Field, Num } from './kit.jsx';
import { downloadBlob } from '../../lib/download.js';

const SIZES = { A4: [595.28, 841.89], Letter: [612, 792] };
export async function textToPdf(text, { size = 'A4', fontSize = 12, font = 'Helvetica' }) {
  const doc = await PDFDocument.create();
  const f = await doc.embedFont(StandardFonts[font]);
  const [W, H] = SIZES[size];
  const m = 56, lh = fontSize * 1.45, maxW = W - m * 2;
  const clean = (s) => s.replace(/\t/g, '    ').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?');
  const lines = [];
  for (const para of text.split(/\r?\n/)) {
    const words = clean(para).split(' ');
    let cur = '';
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(t, fontSize) <= maxW) cur = t;
      else { if (cur) lines.push(cur); cur = w; while (f.widthOfTextAtSize(cur, fontSize) > maxW) { let i = cur.length - 1; while (i > 1 && f.widthOfTextAtSize(cur.slice(0, i), fontSize) > maxW) i--; lines.push(cur.slice(0, i)); cur = cur.slice(i); } }
    }
    lines.push(cur);
  }
  let page, y;
  for (const line of lines) {
    if (!page || y < m) { page = doc.addPage([W, H]); y = H - m; }
    if (line) page.drawText(line, { x: m, y: y - fontSize, size: fontSize, font: f });
    y -= lh;
  }
  if (!doc.getPageCount()) doc.addPage([W, H]);
  return doc.save();
}

export default function TextToPdf({ tool }) {
  const [t, setT] = useState('');
  const [size, setSize] = useState('A4');
  const [fs, setFs] = useState(12);
  const [font, setFont] = useState('Helvetica');
  const [busy, setBusy] = useState(false);
  return (
    <Util tool={tool} howTo={['Type or paste your text.', 'Pick the page size and font size.', 'Press Create PDF.']}>
      <TextArea label="Your text" value={t} onChange={setT} rows={12} testid="t2p-input" />
      <div className="util-grid">
        <Field label="Page size"><select className="input" value={size} onChange={(e) => setSize(e.target.value)}><option>A4</option><option>Letter</option></select></Field>
        <Field label="Font"><select className="input" value={font} onChange={(e) => setFont(e.target.value)}><option value="Helvetica">Sans</option><option value="TimesRoman">Serif</option><option value="Courier">Mono</option></select></Field>
        <Num label="Font size" value={fs} onChange={setFs} min={6} max={40} step={1} />
      </div>
      <p className="muted">Works for English and other Latin-script text. Characters outside that range (such as Hindi) are replaced with "?" here; use Add watermark or Images to PDF for those.</p>
      <div className="util-actions"><button type="button" className="btn btn-primary" data-testid="t2p-go" disabled={!t.trim() || busy} onClick={async () => { setBusy(true); try { downloadBlob('text.pdf', new Blob([await textToPdf(t, { size, fontSize: Math.max(6, Number(fs) || 12), font })], { type: 'application/pdf' })); } finally { setBusy(false); } }}>{busy ? 'Working...' : 'Create PDF'}</button></div>
    </Util>
  );
}
