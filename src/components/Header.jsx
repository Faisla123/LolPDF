import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

export default function Header({ onSearch }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  void pathname;
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Logo />
        <nav className={`nav ${open ? 'is-open' : ''}`} aria-label="Main" onClick={() => setOpen(false)}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/tools">All tools</NavLink>
          <NavLink to="/privacy">Privacy</NavLink>
        </nav>
        <div className="header-actions">
          <button type="button" className="search-btn" onClick={onSearch} aria-label="Search tools">
            <Icon name="search" size={16} />
            <span>Search tools</span>
            <kbd>Ctrl K</kbd>
          </button>
          <Link to="/tools" className="btn btn-small btn-primary header-cta">Start now</Link>
          <button type="button" className="icon-btn menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
