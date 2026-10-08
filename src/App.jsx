import { Suspense, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import IntroLoader from './components/IntroLoader.jsx';
import CursorFollower from './components/CursorFollower.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import ShortcutsDialog from './components/ShortcutsDialog.jsx';
import Home from './pages/Home.jsx';
import ToolsPage from './pages/ToolsPage.jsx';
import Privacy from './pages/Privacy.jsx';
import NotFound from './pages/NotFound.jsx';
import { TOOLS, toolPath } from './data/tools.js';
import { useHotkeys } from './hooks/useHotkeys.js';
import { TOOL_COMPONENTS } from './tools/index.js';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Loading() {
  return <div className="wrap loading-skeleton" role="status" aria-label="Loading tool"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /><div className="skeleton-work"><div className="skeleton skeleton-drop" /><div className="skeleton skeleton-options" /></div><span className="sr-only">Loading tool</span></div>;
}

export default function App() {
  const location = useLocation();
  const firstNavigation = useRef(location.key);
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [palette, setPalette] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  useHotkeys({
    'mod+k': () => setPalette(true),
    '/': () => setPalette(true),
    '?': () => setShortcuts(true),
    escape: () => { setPalette(false); setShortcuts(false); },
  });
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <IntroLoader key={location.key} quick={firstLoadDone || location.key !== firstNavigation.current} onComplete={() => setFirstLoadDone(true)} />
      <CursorFollower />
      <div className="bg-glow" aria-hidden="true" />
      <Header onSearch={() => setPalette(true)} />
      <ScrollToTop />
      <main id="main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/privacy" element={<Privacy />} />
            {TOOLS.map((t) => {
              const C = TOOL_COMPONENTS[t.id];
              return <Route key={t.id} path={toolPath(t)} element={<C tool={t} />} />;
            })}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer onShortcuts={() => setShortcuts(true)} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <ShortcutsDialog open={shortcuts} onClose={() => setShortcuts(false)} />
    </>
  );
}
