import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null
  return (
    <div className={`global-error-banner ${className}`} role="alert">
      <AlertCircle size={16} className="global-error-icon" />
      <span className="global-error-text">{message}</span>
    </div>
  )
}
