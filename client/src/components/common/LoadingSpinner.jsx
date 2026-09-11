export default function LoadingSpinner({
  text = 'Loading…',
  size = 'md',
  fullPage = false,
  className = ''
}) {
  return (
    <div className={`glug-loading-container ${fullPage ? 'is-full-page' : ''} ${className}`}>
      <div className={`glug-spinner-ring size-${size}`}>
        <div className="glug-spinner-inner" />
        <div className="glug-spinner-glow" />
      </div>
      {text && <span className="glug-loading-text">{text}</span>}
    </div>
  )
}
