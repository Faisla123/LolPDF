import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import ToolGrid from '../components/ToolGrid.jsx';
import RecentFiles from '../components/RecentFiles.jsx';
import FAQ from '../components/FAQ.jsx';
import { TOOLS } from '../data/tools.js';
import { SITE, SITE_NAME } from '../config/site.js';

const POINTS = [
  { title: 'Nothing is uploaded', text: 'Every tool runs inside your browser tab. Your documents and photos stay on your device, the whole time.' },
  { title: 'No account needed', text: 'No sign-up, no daily cap, no watermark on your output. Open a tool, finish the job, download, leave.' },
  { title: 'Keep your files close', text: 'Tools you have already loaded can work offline. Open a tool once while online to cache its files.' },
];

const FAQS = [
  ['Is it really free?', 'Yes. There is no sign-up, no daily limit and no watermark. Choose a tool and download your result without paying.'],
  ['Do my files get uploaded?', 'No. PDFs and images are processed by your own device inside the browser tab. Close the tab and they are gone. The background remover downloads extra tool files the first time. That download never includes your photo.'],
  ['Can I use it on my phone?', 'Yes. The layout adapts to phones, and works in a current browser. Large files can exceed device memory; a desktop works better for those.'],
  ['How do I make a PDF smaller than 200 KB?', 'Open Compress PDF, pick Target size and type the limit. It keeps pictures sharp and text as real text, using the best quality that fits. If a limit is too small to reach without visible damage, the tool tells you instead of ruining the pages.'],
  ['Can you convert PDF to Word or run OCR?', 'No. This toolbox does not include PDF to Word or OCR.'],
];

const TICKER = ['Merge', 'Split', 'Compress', 'Sign', 'Repair', 'Rotate', 'Watermark', 'QR codes', 'Passport photos', 'No sign-up', 'No uploads', 'No watermark', 'Free'];

export default function Home() {
  const extras = TOOLS.filter((t) => t.extra);
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return (
    <>
      <Seo
        description={`${SITE_NAME} is a free online toolbox: merge, split, compress and sign PDFs, remove image backgrounds, resize photos and more. No sign-up, files never leave your device.`}
        path="/"
        jsonLd={faqLd}
      />
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <p className="hero-kicker"><span className="status-dot" /> Free PDF &amp; image tools, right in your browser</p>
              <h1 className="hero-title">Big file energy.<br /><em>Small effort.</em></h1>
              <p className="hero-sub">PDFs, photos, and the little jobs in between. Pick a tool, do your thing, download. No account. Your files stay on your device.</p>
              <div className="hero-actions">
                <Link to="/tools" className="btn btn-primary">Browse all tools <Icon name="arrow" size={18} /></Link>
                <Link to="/privacy" className="btn btn-ghost">How it stays private</Link>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="file-window">
                <div className="window-bar"><span>untitled.pdf</span><span>_ &nbsp; □ &nbsp; ×</span></div>
                <div className="file-stage">
                  <div className="orbit" /><div className="orbit orbit-two" />
                  <svg className="happy-file" viewBox="0 0 200 248" fill="none">
                    <path d="M22 3H135L197 65V225Q197 245 177 245H22Q3 245 3 225V23Q3 3 22 3Z" fill="#f4f4f4" stroke="#080808" strokeWidth="3" />
                    <path d="M135 3V45Q135 65 155 65H197" fill="#ff6b00" stroke="#080808" strokeWidth="3" />
                    <path d="M42 119Q55 96 68 119M107 119Q120 96 133 119" stroke="#080808" strokeWidth="10" strokeLinecap="round" />
                    <path d="M40 147H139Q135 199 90 199Q45 199 40 147Z" fill="#080808" />
                    <path d="M65 188Q90 165 116 188Q90 204 65 188Z" fill="#ff6b00" />
                  </svg>
                  <span className="file-sticker">file happy.<br />you happy.</span>
                  <span className="spark spark-one">✳</span><span className="spark spark-two">+</span>
                </div>
                <div className="window-status"><span className="status-dot" /> Ready when you are <span>100% local</span></div>
              </div>
              <span className="art-caption">less waiting. more doing. ↗</span>
            </div>
          </div>
          <div className="hero-meta">
            <span><b>{TOOLS.length}</b> TOOLS &nbsp;/&nbsp; <b>0</b> UPLOADS &nbsp;/&nbsp; <b>0</b> SIGN-UPS</span>
            <a href="#tools">Down to the tools ↓</a>
          </div>
        </div>
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((n) => (
              <span key={n} style={{ display: 'contents' }}>
                {TICKER.map((word) => <span key={`${n}-${word}`}>{word} <i>✦</i></span>)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" id="tools">
        <div className="wrap">
          <Reveal><div className="section-head"><span className="section-index">01</span><h2>The toolbox</h2><Link to="/tools" className="link-btn">See as a list</Link></div></Reveal>
          <ToolGrid showFilters />
        </div>
      </section>

      <RecentFiles />

      <section className="home-section">
        <div className="wrap">
          <Reveal><div className="section-head"><span className="section-index">02</span><h2>No catches</h2></div></Reveal>
          <div className="points-list">
            {POINTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 70}>
                <div className="point-row">
                  <span className="point-index">0{i + 1}</span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="wrap">
          <Reveal><div className="section-head"><span className="section-index">03</span><h2>Little extras, big help</h2></div></Reveal>
          <div className="extras-grid">
            {extras.map((t, i) => (
              <Reveal key={t.id} delay={(i % 2) * 60}>
                <Link to={`/${t.slug}`} className="extra-line">
                  <Icon name={t.icon} size={17} />
                  <span>{t.extra}</span>
                </Link>
              </Reveal>
            ))}
            {[
              'Batch mode: drop many files, get one ZIP back',
              'Before and after size comparison on every result',
              'Simple file names for sharing and forms',
              'Keyboard shortcuts and a Ctrl K tool search',
              'Previously loaded tools can work offline',
              'Recent activity stored only on your device',
            ].map((text, i) => (
              <Reveal key={text} delay={(i % 2) * 60}><div className="extra-line"><Icon name="check" size={17} /><span>{text}</span></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="wrap narrow">
          <Reveal><div className="section-head"><span className="section-index">04</span><h2>Questions</h2></div></Reveal>
          <FAQ items={FAQS} />
          <p className="muted small home-faq-note">Questions or a tool you would like added? Write to {SITE.contactEmail}.</p>
        </div>
      </section>
    </>
  );
}
