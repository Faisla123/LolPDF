import { useEffect, useRef } from 'react';

// handlers: { 'mod+k': fn, '?': fn, 'mod+enter': fn }
export function useHotkeys(handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;
      let combo = e.key.toLowerCase();
      if (mod) combo = `mod+${combo}`;
      const fn = ref.current[combo];
      if (!fn) return;
      if (typing && !mod) return;
      e.preventDefault();
      fn(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
