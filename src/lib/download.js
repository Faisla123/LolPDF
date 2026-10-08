import JSZip from 'jszip';

export function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function zipOutputs(outputs) {
  const zip = new JSZip();
  const used = new Map();
  for (const o of outputs) {
    let name = o.name;
    const n = used.get(name) || 0;
    used.set(name, n + 1);
    if (n) {
      const i = name.lastIndexOf('.');
      name = i > 0 ? `${name.slice(0, i)}-${n + 1}${name.slice(i)}` : `${name}-${n + 1}`;
    }
    zip.file(name, o.blob);
  }
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}
