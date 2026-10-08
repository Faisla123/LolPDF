import { useEffect, useRef, useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import SignaturePad from '../components/SignaturePad.jsx';
import Segmented from '../components/Segmented.jsx';
import Field from '../components/Field.jsx';
import { loadDoc, toBlob } from '../lib/pdfEdit.js';
import { openPdf, renderPage } from '../lib/pdfjs.js';
import { outName } from '../lib/names.js';

function Placer({ entry, sig, place, setPlace }) {
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const box = useRef(null);
  const canvasHolder = useRef(null);
  const drag = useRef(false);

  useEffect(() => {
    let dead = false; let doc;
    openPdf(entry.file).then((d) => { if (dead) { d.destroy(); return; } doc = d; setPdf(d); }).catch(() => {});
    return () => { dead = true; doc?.destroy(); };
  }, [entry.id]);
  useEffect(() => {
    if (!pdf) return;
    let dead = false;
    renderPage(pdf, page, { width: 640 }).then(({ canvas }) => {
      if (dead || !canvasHolder.current) return;
      canvas.style.width = '100%'; canvas.style.display = 'block';
      canvasHolder.current.replaceChildren(canvas);
    });
    setPlace((p) => ({ ...p, page }));
    return () => { dead = true; };
  }, [pdf, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const at = (e) => {
    const r = box.current.getBoundingClientRect();
    setPlace((p) => ({ ...p, x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }));
  };

  return (
    <div className="placer">
      <div className="placer-bar">
        <button type="button" className="btn btn-ghost btn-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {pdf?.numPages || '...'}</span>
        <button type="button" className="btn btn-ghost btn-small" disabled={!pdf || page >= pdf.numPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
      <div
        className="placer-page"
        ref={box}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); at(e); }}
        onPointerMove={(e) => drag.current && at(e)}
        onPointerUp={() => { drag.current = false; }}
        data-cursor-label="Place"
      >
        <div ref={canvasHolder} />
        {sig && <img src={sig.url} alt="Your signature" className="placer-sig" draggable={false} style={{ left: `${place.x * 100}%`, top: `${place.y * 100}%`, width: `${place.w * 100}%` }} />}
      </div>
      <p className="muted small">Click or drag on the page to move your signature.</p>
    </div>
  );
}

export default function SignTool({ tool }) {
  const [sig, setSig] = useState(null);
  const [place, setPlace] = useState({ page: 1, x: 0.7, y: 0.85, w: 0.25 });
  const [apply, setApply] = useState('page');

  const run = async (files, ctx) => {
    if (!sig) throw new Error('Draw or type your signature first.');
    const doc = await loadDoc(files[0]);
    const img = await doc.embedPng(await (await fetch(sig.url)).arrayBuffer());
    const total = doc.getPageCount();
    const targets = apply === 'all' ? doc.getPageIndices() : apply === 'last' ? [total - 1] : [place.page - 1];
    for (const i of targets) {
      const pg = doc.getPage(i);
      const { width, height } = pg.getSize();
      const w = place.w * width;
      const h = (w * sig.h) / sig.w;
      pg.drawImage(img, { x: place.x * width - w / 2, y: height - place.y * height - h / 2, width: w, height: h });
    }
    ctx.progress(0.9, 'Saving');
    return [{ name: ctx.cleanName(outName(files[0], 'signed')), blob: toBlob(await doc.save()), compare: false }];
  };

  return (
    <ToolLayout tool={tool} howTo={['Add your PDF.', 'Draw or type your signature.', 'Move it into place on the page preview and press Sign PDF.']}>
      <Workspace
        tool={tool}
        multiple={false}
        runLabel="Sign PDF"
        options={() => (
          <>
            <SignaturePad onChange={setSig} />
            <Field label={`Signature size ${Math.round(place.w * 100)}%`}>
              <input type="range" min="0.08" max="0.6" step="0.01" value={place.w} onChange={(e) => setPlace((p) => ({ ...p, w: Number(e.target.value) }))} />
            </Field>
            <Field label="Put it on">
              <Segmented label="Apply to" value={apply} onChange={setApply} options={[{ value: 'page', label: 'This page' }, { value: 'last', label: 'Last page' }, { value: 'all', label: 'All pages' }]} />
            </Field>
            <p className="muted small">This adds a picture of your signature. It is not a certified digital signature.</p>
          </>
        )}
        onRun={run}
      >
        {(entries) => <Placer entry={entries[0]} sig={sig} place={place} setPlace={setPlace} />}
      </Workspace>
    </ToolLayout>
  );
}
