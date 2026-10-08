// Parses page lists like "1-3, 7, 9-last". Returns an array of groups, each a list of 0-based page indexes.
export function parseRanges(input, total) {
  const text = String(input || '').trim().toLowerCase();
  if (!text) throw new Error('Type the pages you want, for example 1-3, 5, 8-last.');
  const groups = [];
  for (const rawPart of text.split(',')) {
    const part = rawPart.trim();
    if (!part) continue;
    if (part === 'odd' || part === 'even') {
      const want = part === 'odd' ? 0 : 1;
      const pages = [];
      for (let i = 0; i < total; i++) if (i % 2 === want) pages.push(i);
      groups.push(pages);
      continue;
    }
    const m = part.match(/^(\d+|last)\s*(?:-\s*(\d+|last))?$/);
    if (!m) throw new Error(`"${part}" is not a page or a range. Use numbers like 3 or 2-5.`);
    const toNum = (v) => (v === 'last' ? total : Number(v));
    const a = toNum(m[1]);
    const b = m[2] ? toNum(m[2]) : a;
    if (a < 1 || b < 1 || a > total || b > total) {
      throw new Error(`Page ${Math.max(a, b)} is outside this file. It has ${total} ${total === 1 ? 'page' : 'pages'}.`);
    }
    const pages = [];
    if (a <= b) for (let i = a; i <= b; i++) pages.push(i - 1);
    else for (let i = a; i >= b; i--) pages.push(i - 1);
    groups.push(pages);
  }
  if (!groups.length) throw new Error('Type the pages you want, for example 1-3, 5, 8-last.');
  return groups;
}

export function flattenUnique(groups) {
  const seen = new Set();
  const out = [];
  for (const g of groups) for (const p of g) if (!seen.has(p)) { seen.add(p); out.push(p); }
  return out;
}
