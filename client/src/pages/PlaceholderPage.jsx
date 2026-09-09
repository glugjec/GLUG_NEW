import { Link } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'

export default function PlaceholderPage({ title, subtitle, icon: Icon }) {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '4rem auto',
      padding: '3rem 2rem',
      background: '#111622',
      border: '1px solid #1c2436',
      borderRadius: '20px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.25rem'
    }}>
      {Icon && (
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(37, 99, 235, 0.15)',
          border: '1px solid rgba(37, 99, 235, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3b82f6',
          marginBottom: '0.5rem'
        }}>
          <Icon size={32} />
        </div>
      )}

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.3rem 0.8rem',
        borderRadius: '999px',
        background: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        color: '#facc15',
        fontSize: '0.8rem',
        fontWeight: 600
      }}>
        <Clock size={13} /> Feature in Progress
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
        {title}
      </h1>

      <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '480px', lineHeight: 1.6, margin: 0 }}>
        {subtitle || 'This module is currently being finalized. Full features will be integrated shortly.'}
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.25rem',
          borderRadius: '10px',
          background: '#2563eb',
          color: '#ffffff',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.9rem'
        }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <Link to="/categories" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.25rem',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid #232c3f',
          color: '#cbd5e1',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.9rem'
        }}>
          Explore Categories
        </Link>
      </div>
    </div>
  )
}
