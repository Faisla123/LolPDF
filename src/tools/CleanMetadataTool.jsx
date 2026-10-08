import { useEffect, useState } from 'react';
import { PDFName } from 'pdf-lib';
import ToolLayout from '../components/ToolLayout.jsx';
import Workspace from '../components/Workspace.jsx';
import { PDFDocument, toBlob } from '../lib/pdfEdit.js';
import { readBytes } from '../lib/pdfjs.js';
import { eachFile } from '../lib/batch.js';
import { outName } from '../lib/names.js';

function Found({ file }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let dead = false;
    readBytes(file).then((b) => PDFDocument.load(b, { updateMetadata: false })).then((d) => {
      if (dead) return;
      setInfo([['Title', d.getTitle()], ['Author', d.getAuthor()], ['Subject', d.getSubject()], ['Created with', d.getCreator()], ['Producer', d.getProducer()], ['Keywords', d.getKeywords()]].filter(([, v]) => v));
    }).catch(() => setInfo([]));
    return () => { dead = true; };
  }, [file]);
  if (!info) return null;
  return (
    <div className="meta-found">
      <h3>Hidden details in {file.name}</h3>
      {info.length ? <dl>{info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> : <p className="muted">No visible author, title or software details found.</p>}
    </div>
  );
}

export default function CleanMetadataTool({ tool }) {
  const run = (files, ctx) => eachFile(files, ctx, async (file) => {
    const doc = await PDFDocument.load(await readBytes(file), { updateMetadata: false });
    doc.setTitle(''); doc.setAuthor(''); doc.setSubject(''); doc.setKeywords([]); doc.setCreator(''); doc.setProducer('');
    doc.catalog.delete(PDFName.of('Metadata'));
    doc.context.trailerInfo.Info = undefined;
    return { name: ctx.cleanName(outName(file, 'clean')), blob: toBlob(await doc.save({ updateFieldAppearances: false })) };
  });
  return (
    <ToolLayout tool={tool} howTo={['Add your PDFs. Any hidden details found are listed.', 'Press Clean metadata.', 'Download the file with the details removed.']}>
      <Workspace
        tool={tool}
        runLabel="Clean metadata"
        options={() => <p className="muted">Removes title, author, subject, keywords, the software name and the hidden XML data block.</p>}
        onRun={run}
      >
        {(entries) => entries.slice(0, 3).map((e) => <Found key={e.id} file={e.file} />)}
      </Workspace>
    </ToolLayout>
  );
}
