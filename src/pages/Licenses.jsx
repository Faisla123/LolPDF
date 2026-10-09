import Seo from '../components/Seo.jsx';
import { SITE_NAME } from '../config/site.js';
import { SOURCE_URL } from '../config/site.js';
import { PACKAGES } from '../data/licenses.generated.js';

const MODELS = [
  { name: 'MODNet portrait model', license: 'Apache-2.0', copyright: 'Copyright ZHKKKe and the MODNet authors', text: '/licenses/third-party/MODNet-Apache-2.0.txt', link: 'https://github.com/ZHKKKe/MODNet', note: 'Trimap-free portrait matting. ONNX conversion by Xenova on Hugging Face (Apache-2.0). Used here for photos of people.' },
  { name: 'ISNet model (DIS)', license: 'Apache-2.0 upstream, listed as MIT by IMG.LY', copyright: 'Copyright Xuebin Qin and the DIS authors', text: '/licenses/third-party/MODNet-Apache-2.0.txt', link: 'https://github.com/xuebinqin/DIS', note: 'Dichotomous image segmentation, loaded through @imgly/background-removal. The upstream repository uses the Apache-2.0 text linked here; IMG.LY lists it as MIT in its own notice file, linked below. Both are permissive.' },
];

export default function Licenses() {
  const direct = PACKAGES.filter((p) => p.direct);
  const rest = PACKAGES.filter((p) => !p.direct);
  return (
    <div className="section">
      <Seo title="Licenses and source code" description={`Open source licenses, notices and source code for ${SITE_NAME}.`} path="/licenses" />
      <div className="wrap narrow prose licenses">
        <h1>Licenses and source code</h1>
        <p>{SITE_NAME} is free software. It is released under the GNU Affero General Public License, version 3 (AGPL-3.0). You can read, copy and change the code under that license.</p>
        <ul>
          <li><a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Source code on GitHub</a></li>
          <li><a href="/licenses/AGPL-3.0.txt">Full AGPL-3.0 license text</a></li>
          <li><a href="/licenses/IMG-LY-THIRD-PARTY.json">IMG.LY third-party notice file (JSON)</a></li>
        </ul>
        <p>Copyright (C) 2026 Faisal Khan. This program comes with no warranty, to the extent the law allows.</p>

        <h2>Why AGPL</h2>
        <p>The background remover uses <strong>@imgly/background-removal</strong> by IMG.LY GmbH, which is licensed under AGPL-3.0. That library is part of the code your browser downloads, so the whole site is offered under the same license, with its source linked above.</p>

        <h2>Main libraries</h2>
        <div className="lic-list">
          {direct.map((p) => <Row key={p.name} p={p} />)}
        </div>

        <h2>Background remover models</h2>
        <div className="lic-list">
          {MODELS.map((m) => (
            <div className="lic-row" key={m.name}>
              <div className="lic-head"><strong>{m.name}</strong><span className="lic-tag">{m.license}</span></div>
              <p>{m.copyright}. {m.note}</p>
              <p className="lic-links"><a href={m.link} target="_blank" rel="noopener noreferrer">Project page</a><a href={m.text}>License text</a></p>
            </div>
          ))}
        </div>
        <p>The models download once from the background remover host the first time you use that tool (see <a href="/privacy">Privacy</a>). The portrait model is also served from this site.</p>

        <h2>Libraries bundled inside the above</h2>
        <p>These ship inside the libraries listed earlier and reach your browser with them.</p>
        <div className="lic-list compact">
          {rest.map((p) => <Row key={p.name} p={p} />)}
        </div>

        <h2>Notes</h2>
        <ul>
          <li>qpdf (inside @neslinesli93/qpdf-wasm) is licensed under Apache-2.0. The JavaScript wrapper is ISC.</li>
          <li>jszip is offered under MIT or GPL-3.0-or-later. {SITE_NAME} uses it under MIT.</li>
          <li>Fonts Inter and Bricolage Grotesque are under the SIL Open Font License 1.1, bundled from @fontsource packages.</li>
        </ul>
      </div>
    </div>
  );
}

function Row({ p }) {
  return (
    <div className="lic-row">
      <div className="lic-head">
        <strong>{p.name}</strong><span className="lic-ver">{p.version}</span><span className="lic-tag">{p.license}</span>
      </div>
      <p>{p.copyright.replace(/\.$/, '')}{p.why && p.direct ? `. ${p.why}.` : ''}</p>
      <p className="lic-links"><a href={p.homepage} target="_blank" rel="noopener noreferrer">Package</a><a href={p.text}>{p.generic ? 'License text (standard form)' : 'License text'}</a></p>
    </div>
  );
}
