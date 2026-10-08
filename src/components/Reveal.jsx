import { useInView } from '../hooks/useInView.js';

export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
  const [ref, seen] = useInView({ rootMargin: '0px 0px -8% 0px' });
  return (
    <Tag ref={ref} className={`reveal ${seen ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
