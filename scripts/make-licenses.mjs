// Rebuilds public/licenses/third-party/* and src/data/licenses.generated.js from node_modules.
// Run after changing dependencies: node scripts/make-licenses.mjs
import fs from 'node:fs';
import path from 'node:path';

const NM = 'node_modules';
const OUT = 'public/licenses/third-party';
fs.mkdirSync(OUT, { recursive: true });
const read = (n) => JSON.parse(fs.readFileSync(`${NM}/${n}/package.json`, 'utf8'));

// [package, why it is in the build]
const DIRECT = [
  ['react', 'User interface'], ['react-dom', 'User interface'], ['react-router-dom', 'Page routing'],
  ['pdf-lib', 'Create and edit PDF files'], ['pdfjs-dist', 'Read and render PDF files'],
  ['@neslinesli93/qpdf-wasm', 'PDF compress, repair, protect and unlock (WebAssembly build of qpdf)'],
  ['jszip', 'ZIP files'], ['qrcode', 'QR code maker'],
  ['@imgly/background-removal', 'Background remover'], ['onnxruntime-web', 'Runs the background remover models'],
  ['@fontsource-variable/inter', 'Font'], ['@fontsource-variable/bricolage-grotesque', 'Font'],
];
const BUNDLED = {
  '@imgly/background-removal': ['lodash-es', 'ndarray', 'iota-array', 'is-buffer', 'zod'],
  'onnxruntime-web': ['onnxruntime-common', 'flatbuffers', 'long', 'platform', 'guid-typescript', 'protobufjs', '@protobufjs/aspromise', '@protobufjs/base64', '@protobufjs/codegen', '@protobufjs/eventemitter', '@protobufjs/fetch', '@protobufjs/float', '@protobufjs/path', '@protobufjs/pool', '@protobufjs/utf8'],
  jszip: ['lie', 'immediate', 'pako', 'readable-stream', 'core-util-is', 'inherits', 'isarray', 'process-nextick-args', 'safe-buffer', 'setimmediate', 'string_decoder', 'util-deprecate'],
  'pdf-lib': ['@pdf-lib/standard-fonts', '@pdf-lib/upng', 'pako', 'tslib'],
  qrcode: ['dijkstrajs', 'pngjs'],
  react: ['scheduler'],
  'react-router-dom': ['react-router', 'cookie', 'set-cookie-parser'],
};
const SPDX = { 'SEE LICENSE IN LICENSE.md': 'AGPL-3.0', '(MIT OR GPL-3.0-or-later)': 'MIT', '(MIT AND Zlib)': 'MIT AND Zlib' };
const safe = (n) => n.replace('@', '').replace('/', '__');

function info(name) {
  const j = read(name);
  const dir = `${NM}/${name}`;
  const file = fs.readdirSync(dir).find((f) => /^(licen[sc]e|copying)/i.test(f));
  let copyright = '';
  let textFile = null;
  if (file) {
    const txt = fs.readFileSync(`${dir}/${file}`, 'utf8');
    const m = txt.split('\n').map((l) => l.trim()).find((l) => /^(copyright|\(c\)|©)/i.test(l) && !/\[yyyy\]/.test(l));
    copyright = (m || '').replace(/\s+/g, ' ');
    textFile = `${safe(name)}.txt`;
    fs.writeFileSync(`${OUT}/${textFile}`, txt);
  }
  const a = j.author && (j.author.name || j.author);
  if (!copyright) copyright = a ? `Copyright the authors (${String(a).replace(/<.*>/, '').trim()})` : 'Copyright the package authors';
  let lic = SPDX[j.license] || j.license;
  if (COPYRIGHT[name]) copyright = COPYRIGHT[name];
  return { name, version: j.version, license: lic, copyright, textFile, homepage: `https://www.npmjs.com/package/${name}` };
}

// Fallback texts for packages that ship no license file.
const generic = { MIT: read('react'), };
const mitSrc = fs.readFileSync(`${NM}/react/LICENSE`, 'utf8');
const COPYRIGHT = {
  'pdfjs-dist': 'Copyright Mozilla Foundation',
  '@imgly/background-removal': 'Copyright IMG.LY GmbH',
  '@neslinesli93/qpdf-wasm': 'Copyright neslinesli93 (wrapper). qpdf itself: Copyright Jay Berkenbilt, Apache-2.0',
  'onnxruntime-web': 'Copyright (c) Microsoft Corporation',
  'onnxruntime-common': 'Copyright (c) Microsoft Corporation',
  flatbuffers: 'Copyright Google Inc.',
  long: 'Copyright Daniel Wirtz and The Closure Library Authors',
  'guid-typescript': 'Copyright Nicolas Gagnon',
  isarray: 'Copyright Julian Gruber',
  lie: 'Copyright (c) 2014-2018 Calvin Metcalf, Jordan Harband',
  'process-nextick-args': 'Copyright (c) 2015 Calvin Metcalf',
  pngjs: 'Copyright (c) 2015 Luke Page and original contributors; (c) 2012 Kuba Niegowski',
  dijkstrajs: 'Copyright (C) 2008 Wyatt Baldwin',
};
const rows = new Map();
for (const [n, why] of DIRECT) rows.set(n, { ...info(n), why, direct: true });
for (const [parent, list] of Object.entries(BUNDLED)) for (const n of list) if (!rows.has(n)) rows.set(n, { ...info(n), why: `Part of ${parent}`, direct: false });
for (const r of rows.values()) {
  if (!r.textFile) {
    // No license file shipped. Point at the license text and state the license from the package metadata.
    const key = r.license.startsWith('Apache') ? 'Apache-2.0' : r.license.startsWith('ISC') ? 'ISC' : 'MIT';
    r.textFile = `generic-${key}.txt`;
    r.generic = true;
  }
}
const apache = fs.readFileSync(`${NM}/pdfjs-dist/LICENSE`, 'utf8');
fs.writeFileSync(`${OUT}/generic-Apache-2.0.txt`, apache);
fs.writeFileSync(`${OUT}/generic-MIT.txt`, 'The MIT License (MIT)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\nThe copyright holders are the authors named for each package on the licenses page.\n');
fs.writeFileSync(`${OUT}/generic-ISC.txt`, 'ISC License\n\nPermission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.\n');
// jszip is dual licensed (MIT or GPL-3.0-or-later). lolpdf uses it under MIT.
const list = [...rows.values()].map(({ name, version, license, copyright, textFile, homepage, why, direct, generic: g }) => ({ name, version, license, copyright, text: `/licenses/third-party/${textFile}`, homepage, why, direct, generic: !!g }));
fs.writeFileSync('src/data/licenses.generated.js', `// Generated by scripts/make-licenses.mjs. Do not edit by hand.\nexport const PACKAGES = ${JSON.stringify(list, null, 2)};\n`);
console.log(list.length, 'packages');
