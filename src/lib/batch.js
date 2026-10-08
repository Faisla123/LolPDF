import { friendlyError } from './errors.js';

// Runs fn(file, index) for every file. A failure on one file does not stop the others.
export async function eachFile(files, ctx, fn) {
  const outputs = [];
  const errors = [];
  for (let i = 0; i < files.length; i++) {
    ctx.progress(i / files.length, files.length > 1 ? `File ${i + 1} of ${files.length}` : 'Working');
    try {
      const res = await fn(files[i], i, (p, label) => ctx.progress((i + p) / files.length, label || (files.length > 1 ? `File ${i + 1} of ${files.length}` : 'Working')));
      const list = Array.isArray(res) ? res : [res];
      outputs.push(...list.filter(Boolean));
    } catch (err) {
      errors.push({ name: files[i].name, message: friendlyError(err) });
    }
  }
  ctx.progress(1, 'Done');
  return { outputs, errors };
}
