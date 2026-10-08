import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Field from '../components/Field.jsx';
import { runQpdf } from '../lib/qpdf.js';
import { readBytes } from '../lib/pdfjs.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

function randomPassword() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ProtectTool({ tool }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [noPrint, setNoPrint] = useState(false);
  const [noCopy, setNoCopy] = useState(false);

  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bytes = await readBytes(file);
    const owner = noPrint || noCopy ? randomPassword() : pw;
    const { bytes: out } = await runQpdf(bytes, (i, o) => [
      '--encrypt', pw, owner, '256',
      ...(noPrint ? ['--print=none'] : []),
      ...(noCopy ? ['--extract=n'] : []),
      '--', i, o,
    ]);
    return { name: ctx.cleanName(outName(file, 'protected')), blob: new Blob([out], { type: 'application/pdf' }), compare: false };
  });

  return (
    <ToolLayout tool={tool} howTo={['Add your PDFs.', 'Choose a password and type it twice.', 'Press Protect PDF. Keep the password somewhere safe, it cannot be recovered.']}>
      <Workspace
        tool={tool}
        runLabel="Protect PDF"
        validate={() => (pw.length < 4 ? 'Use a password of at least 4 characters.' : pw !== pw2 ? 'The two passwords do not match.' : null)}
        options={() => (
          <>
            <Field label="Password"><input type={show ? 'text' : 'password'} className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
            <Field label="Repeat password"><input type={show ? 'text' : 'password'} className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
            <label className="check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password</label>
            <label className="check"><input type="checkbox" checked={noPrint} onChange={(e) => setNoPrint(e.target.checked)} /> Block printing</label>
            <label className="check"><input type="checkbox" checked={noCopy} onChange={(e) => setNoCopy(e.target.checked)} /> Block copying text</label>
            <p className="muted small">Uses AES-256. If you forget the password, nobody can open the file, including us.</p>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
