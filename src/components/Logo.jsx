import { Link } from 'react-router-dom';
import { SITE, SITE_NAME } from '../config/site.js';

export default function Logo({ size = 34, to = '/', showWord = true }) {
  const body = (
    <>
      <img src="/logo-mark.svg" width={size} height={size} alt="" className="logo-mark" />
      {showWord && (
        <span className="logo-word">
          {SITE.parts[0]}<span>{SITE.parts[1]}</span>
        </span>
      )}
    </>
  );
  return to ? (
    <Link to={to} className="logo" aria-label={`${SITE_NAME} home`}>{body}</Link>
  ) : (
    <span className="logo">{body}</span>
  );
}
