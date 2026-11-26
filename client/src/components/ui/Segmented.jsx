/** Contrôle segmenté (UISegmentedControl). */
export default function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`} role="group">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
