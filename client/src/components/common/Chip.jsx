export default function Chip({ label, active = false, onClick, className = '' }) {
  const chipClass = active ? 'chip chip-active' : 'chip'
  if (onClick) {
    return (
      <button type="button" className={`${chipClass} ${className}`.trim()} onClick={onClick}>
        {label}
      </button>
    )
  }
  return <span className={`${chipClass} ${className}`.trim()}>{label}</span>
}
