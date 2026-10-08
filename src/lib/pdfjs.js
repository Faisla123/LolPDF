import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function readBytes(file) {
  return new Uint8Array(await file.arrayBuffer());
}

// Opens a PDF for rendering and text reading. Throws a PasswordException when a password is needed.
export async function openPdf(source, password) {
  const data = source instanceof Uint8Array ? source.slice() : await readBytes(source);
  const pdf = await pdfjs.getDocument({ data, password, isEvalSupported: false }).promise;
  // Newer pdf.js hands back a proxy without destroy(); closing goes through the loading task.
  if (typeof pdf.destroy !== 'function') pdf.destroy = () => pdf.loadingTask?.destroy();
  return pdf;
}

export async function renderPage(pdf, pageNumber, { scale = 1, width, rotation } = {}) {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1, rotation });
  const s = width ? width / base.width : scale;
  const viewport = page.getViewport({ scale: s, rotation });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  const size = { width: base.width, height: base.height };
  page.cleanup();
  return { canvas, size };
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.85) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), type, quality);
  });
}

export function isPasswordError(err) {
  return err?.name === 'PasswordException';
}
