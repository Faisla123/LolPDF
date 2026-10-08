import { useEffect, useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import PageThumb from '../components/PageThumb.jsx';
import Icon from '../components/Icon.jsx';
import { loadDoc, degrees, PDFDocument, toBlob } from '../lib/pdfEdit.js';
import { openPdf } from '../lib/pdfjs.js';
import { outName } from '../lib/names.js';

function Organizer({ entry, pages, setPages, busy }) {
  const [pdf, setPdf] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  useEffect(() => {
    let dead = false;
    let doc;
    openPdf(entry.file).then((d) => {
      if (dead) { d.destroy(); return; }
      doc = d;
      setPdf(d);
      setPages(Array.from({ length: d.numPages }, (_, i) => ({ id: i, src: i, rot: 0, del: false })));
    }).catch(() => {});
    return () => { dead = true; doc?.destroy(); };
  }, [entry.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (i, p) => setPages((cur) => cur.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const move = (from, to) => setPages((cur) => {
    if (to < 0 || to >= cur.length || from === to) return cur;
    const next = cur.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  });

  return (
    <div className="organizer">
      <div className="organizer-bar">
        <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={() => setPages((c) => c.slice().reverse())}>Reverse order</button>
        <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={() => setPages((c) => c.map((p) => ({ ...p, rot: (p.rot + 90) % 360 })))}>Rotate all</button>
        <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={() => setPages((c) => c.slice().sort((a, b) => a.src - b.src).map((p) => ({ ...p, del: false, rot: 0 })))}>Reset</button>
        <span className="muted small">Drag a page to move it.</span>
      </div>
      <ul className="page-grid">
        {pages.map((p, i) => (
          <li
            key={p.id}
            className={`page-card ${p.del ? 'is-deleted' : ''} ${dragFrom === i ? 'is-dragging' : ''}`}
            draggable={!busy}
            onDragStart={() => setDragFrom(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); }}
            onDragEnd={() => setDragFrom(null)}
          >
            <PageThumb pdf={pdf} pageNumber={p.src + 1} rotation={p.rot} />
            <div className="page-tools">
              <span className="page-num">{i + 1}</span>
              <button type="button" aria-label="Move earlier" onClick={() => move(i, i - 1)}><Icon name="up" size={14} /></button>
              <button type="button" aria-label="Move later" onClick={() => move(i, i + 1)}><Icon name="down" size={14} /></button>
              <button type="button" aria-label="Rotate page" onClick={() => patch(i, { rot: (p.rot + 90) % 360 })}><Icon name="rotate" size={14} /></button>
              <button type="button" aria-label={p.del ? 'Keep page' : 'Delete page'} onClick={() => patch(i, { del: !p.del })}><Icon name={p.del ? 'plus' : 'trash'} size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OrganizeTool({ tool }) {
  const [pages, setPages] = useState([]);
  const run = async (files, ctx) => {
    const src = await loadDoc(files[0]);
    const keep = pages.filter((p) => !p.del);
    if (!keep.length) throw new Error('Every page is marked for deletion. Keep at least one.');
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, keep.map((p) => p.src));
    copied.forEach((pg, i) => {
      if (keep[i].rot) pg.setRotation(degrees((pg.getRotation().angle + keep[i].rot) % 360));
      out.addPage(pg);
    });
    out.setProducer('');
    ctx.progress(0.9, 'Saving');
    return [{ name: ctx.cleanName(outName(files[0], 'organized')), blob: toBlob(await out.save()) }];
  };
  return (
    <ToolLayout tool={tool} howTo={['Add a PDF and wait for the page thumbnails.', 'Drag pages into the order you want. Rotate or delete any page.', 'Press Save PDF and download.']}>
      <Workspace
        preview={false}
        tool={tool}
        multiple={false}
        runLabel="Save PDF"
        options={() => {
          const kept = pages.filter((p) => !p.del).length;
          return <p className="muted">{kept} of {pages.length} pages will be kept.</p>;
        }}
        onRun={run}
      >
        {(entries, busy) => <Organizer entry={entries[0]} pages={pages} setPages={setPages} busy={busy} />}
      </Workspace>
    </ToolLayout>
  );
}
