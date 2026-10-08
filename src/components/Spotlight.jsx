// Wraps a card so a soft light follows the pointer across its surface.
export default function Spotlight({ as: Tag = 'div', className = '', children, ...rest }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <Tag className={`spot ${className}`} onPointerMove={onMove} {...rest}>
      {children}
    </Tag>
  );
}
