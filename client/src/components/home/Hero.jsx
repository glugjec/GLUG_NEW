import { Link } from 'react-router-dom'

export default function Hero({ title, subtitle, primaryAction, secondaryAction }) {
  return (
    <div className="hero-section">
      <h1 className="page-title">{title}</h1>
      <p className="hero-subtitle">{subtitle}</p>
      <div className="hero-actions">
        {primaryAction && (
          <Link to={primaryAction.to} className="btn btn-primary">
            {primaryAction.label}
          </Link>
        )}
        {secondaryAction && (
          <Link to={secondaryAction.to} className="btn btn-ghost">
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  )
}
