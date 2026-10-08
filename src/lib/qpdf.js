// qpdf runs as WebAssembly inside the browser. It is only loaded when a tool needs it.
let modulePromise;

async function loadFactory() {
  if (!modulePromise) {
    modulePromise = Promise.all([
      import('@neslinesli93/qpdf-wasm'),
      import('@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url'),
    ]).then(([mod, wasm]) => ({ create: mod.default, wasmUrl: wasm.default }));
  }
  return modulePromise;
}

// Returns { bytes, warnings }. Exit code 3 means "finished with warnings", which is fine for repairs.
export async function runQpdf(inputBytes, buildArgs) {
  const { create, wasmUrl } = await loadFactory();
  let log = '';
  const qpdf = await create({
    noInitialRun: true,
    locateFile: () => wasmUrl,
    print: (t) => { log += t + '\n'; },
    printErr: (t) => { log += t + '\n'; },
  });
  qpdf.FS.writeFile('/in.pdf', inputBytes);
  let code = 0;
  try {
    code = qpdf.callMain(buildArgs('/in.pdf', '/out.pdf'));
  } catch (e) {
    code = typeof e?.status === 'number' ? e.status : 2;
  }
  if (code !== 0 && code !== 3) {
    const err = new Error(/invalid password/i.test(log) ? 'invalid password' : log.trim().split('\n').pop() || 'qpdf failed');
    err.qpdfLog = log;
    throw err;
  }
  let bytes;
  try {
    bytes = qpdf.FS.readFile('/out.pdf');
  } catch {
    throw new Error(log.trim().split('\n').pop() || 'qpdf produced no file');
  }
  return { bytes, warnings: code === 3 ? log.trim() : '' };
}
