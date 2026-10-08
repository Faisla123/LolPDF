import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import ToolLayout from '../../components/ToolLayout.jsx';
import Workspace from '../../components/Workspace.jsx';
import { Field } from './kit.jsx';
import { readBytes } from '../../lib/pdfjs.js';
import { eachFile } from '../../lib/batch.js';
import { outName } from '../../lib/names.js';

export default function EditPdfInfo({ tool }) {
  const [f, setF] = useState({ title: '', author: '', subject: '', keywords: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const doc = await PDFDocument.load(await readBytes(file), { ignoreEncryption: true, updateMetadata: false });
    if (f.title) doc.setTitle(f.title);
    if (f.author) doc.setAuthor(f.author);
    if (f.subject) doc.setSubject(f.subject);
    if (f.keywords) doc.setKeywords(f.keywords.split(',').map((k) => k.trim()).filter(Boolean));
    doc.setModificationDate(new Date());
    return { name: ctx.cleanName(outName(file, 'info')), blob: new Blob([await doc.save()], { type: 'application/pdf' }) };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add a PDF.', 'Fill the fields you want to change. Empty fields stay as they are.', 'Press Save details and download.']}>
      <Workspace tool={tool} runLabel="Save details" onRun={run} options={() => (
        <>
          <Field label="Title"><input className="input" value={f.title} onChange={set('title')} /></Field>
          <Field label="Author"><input className="input" value={f.author} onChange={set('author')} /></Field>
          <Field label="Subject"><input className="input" value={f.subject} onChange={set('subject')} /></Field>
          <Field label="Keywords" hint="Separate with commas."><input className="input" value={f.keywords} onChange={set('keywords')} /></Field>
        </>
      )} />
    </ToolLayout>
  );
}
