import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

export default function NotFound() {
  return (
    <div className="section">
      <Seo title="Page not found" description="This page does not exist." path="/404" />
      <div className="wrap narrow center">
        <h1>That page is not here</h1>
        <p className="muted">The link may be old or mistyped.</p>
        <Link to="/tools" className="btn btn-primary">See all tools</Link>
      </div>
    </div>
  );
}
