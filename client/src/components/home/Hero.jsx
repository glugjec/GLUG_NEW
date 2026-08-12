import { Link } from 'react-router-dom'
import Typewriter from '../common/Typewriter.jsx'

export default function Hero({ title, subtitle, primaryAction, secondaryAction, children }) {
  return (
    <div className={children ? 'hero-section hero-split' : 'hero-section'}>
      <div className="hero-col">
        <Typewriter tag="h1" text={title} className="page-title" />
        <Typewriter
          tag="p"
          text={subtitle}
          className="hero-subtitle"
          speed={18}
          startDelay={title.length * 45 + 400}
        />
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
      {children && <div className="hero-col">{children}</div>}
    </div>
  )
}