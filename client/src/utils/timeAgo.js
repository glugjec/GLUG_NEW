export function formatRelativeTime(dateInput, { compact = true } = {}) {
  if (!dateInput) return 'Recently'
  if (typeof dateInput === 'string' && (dateInput.includes('ago') || dateInput.includes('Just now'))) {
    return dateInput
  }
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'Recently'
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return compact ? `${diffMin}m ago` : `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`
  }
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    return compact ? `${diffHours}h ago` : `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  }
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return compact ? `${diffDays}d ago` : `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  }
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffDays < 30) {
    return compact ? `${diffWeeks}w ago` : `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`
  }
  const diffMonths = Math.floor(diffDays / 30)
  if (diffDays < 365) {
    return compact ? `${diffMonths}mo ago` : `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  }
  const diffYears = Math.floor(diffDays / 365)
  return compact ? `${diffYears}y ago` : `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`
}
