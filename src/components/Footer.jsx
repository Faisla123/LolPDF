import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { TOOLS, toolPath } from '../data/tools.js';
import { SITE, SOURCE_URL } from '../config/site.js';

export default function Footer({ onShortcuts }) {
  const cols = [
    ['PDF tools', TOOLS.filter((t) => ['organize', 'optimize', 'convert', 'edit', 'security'].includes(t.group))],
    ['Image and more', TOOLS.filter((t) => ['image', 'more'].includes(t.group))],
  ];
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>{SITE.tagline}. No account, no uploads, no watermarks.</p>
        </div>
        {cols.map(([title, list]) => (
          <div key={title}>
            <h4>{title}</h4>
            <ul>{list.map((t) => <li key={t.id}><Link to={toolPath(t)}>{t.name}</Link></li>)}</ul>
          </div>
        ))}
        <div>
          <h4>Site</h4>
          <ul>
            <li><Link to="/tools">All tools</Link></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/licenses">Licenses</Link></li>
            <li><a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Source code</a></li>
            <li><button type="button" className="link-btn" onClick={onShortcuts}>Keyboard shortcuts</button></li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>Files are processed on your device and are never uploaded.</span>
        <span className="footer-legal">Open source under AGPL-3.0. <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">Source code</a> · <Link to="/licenses">Licenses</Link></span>
      </div>
    </footer>
  );
}
