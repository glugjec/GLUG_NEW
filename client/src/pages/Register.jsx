import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import AuthField from '../components/auth/AuthField.jsx'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/auth/register', { username, email, password })
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-glow" />
        <div className="auth-brand">
          <div className="auth-logo">G</div>
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Join the GLUG community. It's free.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M11 15h2v2h-2v-2Zm0-8h2v6h-2V7Zm.99-5L1 21h22L11.99 2Z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={submit} noValidate>
          <AuthField
            label="USERNAME"
            placeholder="your_name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <AuthField
            label="EMAIL"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthField
            label="PASSWORD"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Continue'}
            <span className="auth-submit-glint" />
          </button>
        </form>

        <div className="auth-divider" />
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </AuthLayout>
  )
}