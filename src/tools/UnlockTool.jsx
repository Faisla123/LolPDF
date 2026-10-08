import { useState } from 'react';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import Field from '../components/Field.jsx';
import { runQpdf } from '../lib/qpdf.js';
import { readBytes, openPdf, isPasswordError } from '../lib/pdfjs.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

export default function UnlockTool({ tool }) {
  const [pw, setPw] = useState('');
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const bytes = await readBytes(file);
    try {
      const { bytes: out } = await runQpdf(bytes, (i, o) => [`--password=${pw}`, '--decrypt', i, o]);
      return { name: ctx.cleanName(outName(file, 'unlocked')), blob: new Blob([out], { type: 'application/pdf' }), compare: false };
    } catch (e) {
      let needsPassword = /invalid password/i.test(e.message);
      if (!needsPassword) {
        try { (await openPdf(bytes, pw)).destroy(); } catch (e2) { needsPassword = isPasswordError(e2); }
      }
      if (needsPassword) throw new Error(pw ? 'That password did not open this file.' : 'This file needs its password. Type it in the box and try again.');
      throw e;
    }
  });
  return (
    <ToolLayout tool={tool} howTo={['Add the locked PDF.', 'Type its password if it asks you to enter one to open it. Leave it empty if it only blocks printing or editing.', 'Press Unlock PDF and download.']}>
      <Workspace
        tool={tool}
        allowLockedFiles
        runLabel="Unlock PDF"
        options={() => (
          <>
            <Field label="Password (if the file asks for one)">
              <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" />
            </Field>
            <p className="muted small">Use this on files you own or have permission to open. It cannot guess a forgotten password.</p>
          </>
        )}
        onRun={run}
      />
    </ToolLayout>
  );
}
