import { useEffect, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView.js';
import { renderPage } from '../lib/pdfjs.js';

// Draws one page thumbnail once it scrolls near the viewport.
export default function PageThumb({ pdf, pageNumber, rotation = 0, width = 150 }) {
  const [ref, seen] = useInView({ rootMargin: '300px' });
  const holder = useRef(null);
  const [ratio, setRatio] = useState(1.4);
  useEffect(() => {
    if (!seen || !pdf) return undefined;
    let dead = false;
    renderPage(pdf, pageNumber, { width: width * 2 }).then(({ canvas, size }) => {
      if (dead || !holder.current) return;
      setRatio(size.height / size.width);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      holder.current.replaceChildren(canvas);
    }).catch(() => {});
    return () => { dead = true; };
  }, [seen, pdf, pageNumber, width]);
  return (
    <div ref={ref} className="thumb" style={{ aspectRatio: `1 / ${ratio}` }}>
      <div ref={holder} className="thumb-canvas" style={{ transform: `rotate(${rotation}deg)` }} />
    </div>
  );
}
