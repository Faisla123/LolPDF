import Seo from '../components/Seo.jsx';
import ToolGrid from '../components/ToolGrid.jsx';
import { SITE_NAME } from '../config/site.js';

export default function ToolsPage() {
  return (
    <div className="section">
      <Seo title="All free PDF and image tools" description={`Every ${SITE_NAME} tool in one place: PDF merge, split, compress, sign, protect, plus image background remover, resizer and converter. Free, no sign-up.`} path="/tools" />
      <div className="wrap">
        <div className="page-title">
          <h1>All tools</h1>
          <p>Pick a tool. Nothing leaves your device.</p>
        </div>
        <ToolGrid />
      </div>
    </div>
  );
}
