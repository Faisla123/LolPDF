import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import Spotlight from './Spotlight.jsx';
import { toolPath } from '../data/tools.js';

export default function ToolCard({ tool }) {
  return (
    <Spotlight as={Link} to={toolPath(tool)} className="tool-card" data-testid={`card-${tool.id}`}>
      <span className="tool-icon"><Icon name={tool.icon} size={22} /></span>
      <h3>{tool.name}</h3>
      <p>{tool.tagline}</p>
      {tool.extra && <span className="badge">Extra</span>}
    </Spotlight>
  );
}
