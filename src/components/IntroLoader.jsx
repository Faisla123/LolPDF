import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// A plain 1-100% counter, then the orb laughs and spells LOL, then ten strips
// wipe the scene away. The counter follows an irregular timeline so it feels
// like real work, holds at 97 until fonts/paint are ready, and caps the wait.
const STEPS = [[0, 1], [280, 8], [560, 21], [900, 34], [1220, 43], [1560, 58], [1880, 69], [2160, 83], [2440, 91], [2680, 97]];
const COUNT_MS = 2680;
const READY_CAP_MS = 3000;
const FINISH_MS = 240;
const LOL_MS = 1250;
const PRE_STRIP_MS = 260;
const STRIP_MS = 10 * 90 + 900 + 140;

const smooth = (t) => t * t * (3 - 2 * t);
function stepAt(t) {
  if (t <= STEPS[0][0]) return STEPS[0][1];
  for (let i = 1; i < STEPS.length; i++) {
    if (t < STEPS[i][0]) {
      const [t0, p0] = STEPS[i - 1], [t1, p1] = STEPS[i];
      return p0 + (p1 - p0) * smooth((t - t0) / (t1 - t0));
    }
  }
  return STEPS[STEPS.length - 1][1];
}

// Each navigation gets a fresh keyed instance. No session flag or mutable
// module state: StrictMode can cancel/restart an effect without consuming it.
export default function IntroLoader({ quick = false, onComplete }) {
  const [state, setState] = useState(() => ({
    phase: 'count', exiting: false,
    gone: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }));
  const scene = useRef(null), strips = useRef([]);
  const num = useRef(null), cover = useRef(null), bar = useRef(null);
  useEffect(() => {
    if (state.gone) return undefined;
    const countMs = quick ? 450 : COUNT_MS;
    const finishMs = quick ? 100 : FINISH_MS;
    const lolMs = quick ? 500 : LOL_MS;
    const preStripMs = quick ? 50 : PRE_STRIP_MS;
    const stripMs = quick ? 640 : STRIP_MS;
    let cancelled = false, raf = 0, ready = false, finishing = -1;
    const timers = [], started = performance.now();
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    Promise.race([document.fonts.ready, new Promise((r) => later(r, READY_CAP_MS))]).then(() => { ready = true; });
    const paint = (p) => {
      if (num.current) num.current.textContent = String(Math.round(p));
      // Black disc slides off the orange one: crescent -> half -> full.
      if (cover.current) cover.current.setAttribute('cx', String(150 + (118 - (p / 100) * 368)));
      if (bar.current) bar.current.style.transform = `scaleX(${p / 100})`;
    };
    const tick = (now) => {
      if (cancelled) return;
      const t = now - started;
      let p;
      if (t < countMs) p = stepAt(t * COUNT_MS / countMs);
      else if (!ready) p = 97;
      else {
        if (finishing < 0) finishing = now;
        p = Math.min(100, 97 + ((now - finishing) / finishMs) * 3);
      }
      paint(p);
      if (p >= 100) {
        setState((s) => ({ ...s, phase: 'lol' }));
        later(() => {
          if (cancelled) return;
          // Freeze the actual rendered LOL scene into the strips.
          strips.current.forEach((el, i) => {
            const copy = scene.current.cloneNode(true);
            // At 100% the mask is a no-op; drop it so clones never resolve the
            // duplicated mask id against the hidden original scene.
            copy.querySelector('.intro-orb-face')?.removeAttribute('mask');
            copy.querySelector('defs')?.remove();
            copy.removeAttribute('aria-live'); copy.setAttribute('aria-hidden', 'true');
            copy.style.top = `${-i * 10}dvh`;
            el.replaceChildren(copy);
          });
          setState((s) => ({ ...s, exiting: true }));
        }, lolMs);
        later(() => {
          if (cancelled) return;
          setState((s) => ({ ...s, gone: true }));
          onComplete?.();
        }, lolMs + preStripMs + stripMs);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    paint(1);
    raf = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, []);
  useLayoutEffect(() => {
    const surfaces = [...document.querySelectorAll('.site-header, main, .site-footer')];
    surfaces.forEach((el) => { el.inert = !state.gone; });
    const overflow = document.body.style.overflow;
    if (!state.gone) document.body.style.overflow = 'hidden';
    return () => { surfaces.forEach((el) => { el.inert = false; }); document.body.style.overflow = overflow; };
  }, [state.gone]);
  if (state.gone) return null;
  return (
    <div className={`intro-loader${quick ? ' is-quick' : ''}${state.exiting ? ' is-exiting' : ''}`} role="status" aria-live="polite" aria-label={quick ? "Opening page" : "Opening lolpdf"}>
      <div ref={scene} className={`intro-scene is-${state.phase}`}>
        <div className="intro-top"><span>lolpdf<span className="intro-brand-dot">.</span></span><span>GOOD FILES. GOOD TIMES.</span></div>
        <div className="intro-stage" aria-hidden="true">
          <span className="lol-letter lol-left">L</span>
          <svg className="intro-orb" viewBox="0 0 300 300" fill="none">
            <defs>
              <mask id="intro-orb-mask">
                <rect width="300" height="300" fill="#fff" />
                <circle ref={cover} cx="268" cy="150" r="134" fill="#000" />
              </mask>
            </defs>
            <circle className="intro-orb-face" cx="150" cy="150" r="132" fill="#ff6b00" mask="url(#intro-orb-mask)" />
            <g className="lol-face">
              <path d="M104 128Q118 104 132 128" stroke="#080808" strokeWidth="10" strokeLinecap="round" />
              <path d="M168 128Q182 104 196 128" stroke="#080808" strokeWidth="10" strokeLinecap="round" />
              <path d="M100 152H200Q194 220 150 220Q106 220 100 152Z" fill="#080808" />
              <path d="M114 152H186V168H114Z" fill="#fff" />
              <path d="M126 204Q150 186 174 204Q150 218 126 204Z" fill="#ff6b00" />
            </g>
          </svg>
          <span className="lol-letter lol-right">L</span>
        </div>
        <div className="intro-count" aria-hidden="true"><span ref={num}>1</span><span className="intro-count-sign">%</span></div>
        <div className="intro-caption"><span className="intro-cap-count">WARMING UP THE TOOLS</span><span className="intro-cap-lol">OK, YOU&rsquo;RE IN.</span></div>
        <div className="intro-bar" aria-hidden="true"><i ref={bar} /></div>
      </div>
      <div className="intro-strips" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} ref={(el) => { strips.current[i] = el; }} className={`intro-strip ${i % 2 ? 'exit-right' : 'exit-left'}`} style={{ top: `${i * 10}%`, transitionDelay: `${i * (quick ? 25 : 90)}ms` }} />
        ))}
      </div>
    </div>
  );
}
