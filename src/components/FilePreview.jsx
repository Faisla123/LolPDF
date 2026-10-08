import { useEffect, useState } from 'react';
import { useObjectUrl } from '../hooks/useObjectUrl.js';
import { loadBitmap, drawCanvas, dims } from '../lib/images.js';
import { canvasToBlob } from '../lib/pdfjs.js';
import { extOf } from '../lib/format.js';
import PageThumb from './PageThumb.jsx';
import { openPdf } from '../lib/pdfjs.js';
import { plural } from '../lib/format.js';

function PdfPreview({ entry }) {
  const [pdf, setPdf] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let dead = false, doc = null;
    setPdf(null); setFailed(false);
    openPdf(entry.file).then((d) => { if (dead) { d.destroy(); return; } doc = d; setPdf(d); })
      .catch(() => { if (!dead) setFailed(true); });
    return () => { dead = true; if (doc) doc.destroy(); };
  }, [entry.file]);
  if (entry.locked) return <p className="muted">This PDF is locked, so there is nothing to preview yet.</p>;
  if (failed) return <p className="muted">Could not draw a preview of this file.</p>;
  if (!pdf) return <p className="muted">Loading preview...</p>;
  return (
    <ol className="preview-pages" data-testid="preview-pages">
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <li key={i} className="preview-page">
          <PageThumb pdf={pdf} pageNumber={i + 1} width={220} />
          <span className="preview-no">{i + 1}</span>
        </li>
      ))}
    </ol>
  );
}

const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'svg', 'heic', 'heif', 'ico'];
export const isImageFile = (f) => f.type.startsWith('image/') || IMG_EXT.includes(extOf(f.name));

function ImagePreview({ entry }) {
  const direct = useObjectUrl(entry.file);
  const [fallback, setFallback] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFallback(''); setFailed(false); }, [entry.file]);
  useEffect(() => () => { if (fallback) URL.revokeObjectURL(fallback); }, [fallback]);
  // If the browser refuses the file as an <img>, decode it ourselves and show a PNG copy.
  const recover = async () => {
    try {
      const bmp = await loadBitmap(entry.file);
      const { w, h } = dims(bmp);
      const k = Math.min(1, 1600 / Math.max(w, h));
      const blob = await canvasToBlob(drawCanvas(bmp, w * k, h * k), 'image/png');
      bmp.close?.();
      setFallback(URL.createObjectURL(blob));
    } catch { setFailed(true); }
  };
  if (failed) return <p className="muted">This browser cannot draw a preview of {entry.file.name}, but the tool can still try to use it.</p>;
  const src = fallback || direct;
  if (!src) return <p className="muted">Loading preview...</p>;
  return <div className="preview-image"><img src={src} alt={`Preview of ${entry.file.name}`} data-testid="preview-image" onError={() => { if (!fallback) recover(); else setFailed(true); }} /></div>;
}

// Shows what was uploaded: every page of a PDF, or the image itself.
export default function FilePreview({ entries }) {
  return (
    <section className="file-preview" aria-label="Preview">
      <h2 className="ws-title">Preview</h2>
      {entries.map((e) => (
        <div key={e.id} className="preview-block">
          {entries.length > 1 && <p className="preview-name">{e.file.name}{e.pages ? ` · ${plural(e.pages, 'page')}` : ''}</p>}
          {isImageFile(e.file) ? <ImagePreview entry={e} /> : <PdfPreview entry={e} />}
        </div>
      ))}
    </section>
  );
}
