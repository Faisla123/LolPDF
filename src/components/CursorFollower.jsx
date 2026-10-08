import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [role="button"], summary, label[for], select, .tool-card, .chip, [data-cursor="link"]';

export default function CursorFollower() {
  const ring = useRef(null);
  const dot = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return undefined;
    const r = ring.current;
    const d = dot.current;
    const l = label.current;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, visible = false;

    const setState = (el) => {
      const text = el?.closest?.('[data-cursor-label]')?.getAttribute('data-cursor-label');
      const hot = !!el?.closest?.(INTERACTIVE);
      const field = !!el?.closest?.('input[type="text"], input[type="password"], input[type="number"], textarea');
      r.classList.toggle('is-hot', hot && !text);
      r.classList.toggle('is-field', field);
      r.classList.toggle('has-label', !!text);
      l.textContent = text || '';
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x; ry = y;
        r.style.opacity = '1';
        d.style.opacity = '1';
      }
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      setState(e.target);
      if (reduce) r.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onDown = () => r.classList.add('is-down');
    const onUp = () => r.classList.remove('is-down');
    const onLeave = () => { visible = false; r.style.opacity = '0'; d.style.opacity = '0'; };

    const tick = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    if (!reduce) raf = requestAnimationFrame(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.body.classList.add('has-follower');
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.body.classList.remove('has-follower');
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true"><svg className="cursor-file" viewBox="0 0 48 58" fill="none"><path d="M7 1H31L47 17V50Q47 57 40 57H7Q1 57 1 50V8Q1 1 7 1Z" fill="#ffffff" stroke="#202522" strokeWidth="2"/><path d="M31 1V12Q31 17 36 17H47" fill="#ff6b00" stroke="#202522" strokeWidth="2"/><path d="M11 29Q15 22 19 29M29 29Q33 22 37 29" stroke="#202522" strokeWidth="3" strokeLinecap="round"/><path d="M11 36H37Q35 49 24 49Q13 49 11 36Z" fill="#202522"/><path d="M17 45Q24 39 31 45Q24 50 17 45Z" fill="#ff6b00"/></svg><span ref={label} className="cursor-label" /></div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
