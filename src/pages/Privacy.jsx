import Seo from '../components/Seo.jsx';
import { SITE, SITE_NAME } from '../config/site.js';

export default function Privacy() {
  return (
    <div className="section">
      <Seo title="Privacy" description={`How ${SITE_NAME} keeps your files private: everything is processed in your browser and nothing is uploaded.`} path="/privacy" />
      <div className="wrap narrow prose">
        <h1>Privacy</h1>
        <p>{SITE_NAME} has no accounts, no server that receives your files and no advertising scripts. Here is exactly what that means.</p>
        <h2>Your files</h2>
        <p>PDFs and images you choose are read by your browser and processed by code running in the same tab. The results are created in your device memory and offered as a download. They are never sent to us or to anyone else. When you close or reload the tab, they are gone.</p>
        <h2>What is stored on your device</h2>
        <ul>
          <li>A short list of recent actions (tool name, file name, sizes) so you can jump back. File contents are not stored. You can clear it from the home page.</li>
          <li>Small preferences, such as the clean file name setting.</li>
          <li>Cached site files and tools you have already loaded. Tools not yet cached need an internet connection.</li>
        </ul>
        <h2>The one download that is not the site</h2>
        <p>The background remover downloads background-removal files totaling about 40 to 85 MB. Your browser downloads them once from a public file host the first time you use that tool, then caches them. Only these files come down. Your photo is not sent anywhere.</p>
        <h2>Cookies and tracking</h2>
        <p>None. No analytics, no cookies, no third party fonts.</p>
        <h2>How to check this yourself</h2>
        <p>Open your browser developer tools, go to the Network tab, and run any tool. You will see no upload request. You can also switch off your internet after a tool and its dependencies have loaded. A tool not yet cached, or a first-time background-removal download, still needs internet.</p>
        <h2>Contact</h2>
        <p>{SITE.contactEmail}</p>
      </div>
    </div>
  );
}
