import { Link } from 'react-router-dom';
import Seo from './Seo.jsx';
import Icon from './Icon.jsx';
import ToolCard from './ToolCard.jsx';
import { TOOLS, toolPath } from '../data/tools.js';
import { SITE, SITE_NAME } from '../config/site.js';

export default function ToolLayout({ tool, children, notice, howTo }) {
  const related = TOOLS.filter((t) => t.group === tool.group && t.id !== tool.id).concat(TOOLS.filter((t) => t.group !== tool.group && t.id !== tool.id)).slice(0, 3);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${tool.name} - ${SITE_NAME}`,
    url: `${SITE.url}${toolPath(tool)}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: `${tool.seo}. Free, no sign-up, files stay on your device.`,
  };
  return (
    <div className="tool-page">
      <Seo
        title={`${tool.seo} - Free, No Sign-up`}
        description={`${tool.seo} online for free. No account, no watermark and no upload: your files are processed inside your browser.`}
        path={toolPath(tool)}
        jsonLd={jsonLd}
      />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><Link to="/tools">Tools</Link><span>/</span><span>{tool.name}</span>
        </nav>
        <header className="tool-head">
          <span className="tool-icon big"><Icon name={tool.icon} size={28} /></span>
          <div>
            <h1>{tool.seo}</h1>
            <p>{tool.tagline}</p>
          </div>
        </header>
        <p className="privacy-note"><Icon name="shield" size={16} /> {notice || 'Your files stay in this browser tab. Nothing is uploaded.'}</p>
        {children}
        {howTo && (
          <section className="howto">
            <h2>How to use {tool.name}</h2>
            <ol>{howTo.map((s) => <li key={s}>{s}</li>)}</ol>
          </section>
        )}
        <section className="related">
          <h2>More tools</h2>
          <div className="tool-grid">{related.map((t) => <ToolCard key={t.id} tool={t} />)}</div>
        </section>
      </div>
    </div>
  );
}
