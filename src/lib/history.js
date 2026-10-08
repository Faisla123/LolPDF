// Recent activity stays in this browser only. It stores file names and sizes, never file contents.
const KEY = 'toolsite.recent.v1';
const MAX = 12;

export function getHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function addHistory(entry) {
  const list = [{ ...entry, id: Date.now() + Math.random(), at: Date.now() }, ...getHistory()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('toolsite-history'));
  } catch { /* storage full or blocked */ }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('toolsite-history'));
  } catch { /* ignore */ }
}
