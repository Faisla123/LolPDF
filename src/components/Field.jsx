export default function Field({ label, hint, children, inline = false }) {
  return (
    <div className={`field ${inline ? 'field-inline' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
