import { useEffect, useState } from 'react';

export function usePref(key, initial) {
  const k = `toolsite.pref.${key}`;
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(k);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* ignore */ }
  }, [k, value]);
  return [value, setValue];
}
