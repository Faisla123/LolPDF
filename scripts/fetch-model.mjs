// Downloads the portrait model (MODNet, Apache-2.0, 26 MB) into public/models on install/build.
// It is kept out of git and the project zip because of its size. Safe to run again: it skips a file that is already complete.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const URL_ = 'https://huggingface.co/Xenova/modnet/resolve/main/onnx/model.onnx';
const OUT = new URL('../public/models/modnet.onnx', import.meta.url);
const SIZE = 25888640;
if (existsSync(OUT) && statSync(OUT).size === SIZE) process.exit(0);
mkdirSync(new URL('../public/models/', import.meta.url), { recursive: true });
try {
  const res = await fetch(URL_, { redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length !== SIZE) throw new Error('unexpected size ' + buf.length);
  writeFileSync(OUT, buf);
  console.log('portrait model ready (sha256 ' + createHash('sha256').update(buf).digest('hex').slice(0, 12) + ')');
} catch (e) {
  console.warn('Could not download the portrait model (' + e.message + '). Background removal still works; people photos will use the general model. Download it from ' + URL_ + ' to public/models/modnet.onnx.');
}
