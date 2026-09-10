import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import AuthField from '../components/auth/AuthField.jsx'
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setGlobalError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const data = await authApi.register({ username, email, password })
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      const msg = err.message || 'Registration failed'
      if (/username/i.test(msg)) {
        setFieldErrors({ username: msg })
      } else if (/email/i.test(msg)) {
        setFieldErrors({ email: msg })
      } else if (/password/i.test(msg)) {
        setFieldErrors({ password: msg })
      } else {
        setGlobalError(msg)
      }
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-glow" />
        <div className="auth-brand">
          <img src="/logo.png" alt="GLUG" className="auth-logo" />
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Join the GLUG community. It's free.</p>
        </div>

        {globalError && (
          <div className="auth-error" role="alert">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M11 15h2v2h-2v-2Zm0-8h2v6h-2V7Zm.99-5L1 21h22L11.99 2Z" />
            </svg>
            <span>{globalError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={submit} noValidate>
          <AuthField
            label="USERNAME"
            placeholder="your_name"
            value={username}
            error={fieldErrors.username}
            onChange={(e) => {
              clearFieldError('username')
              setUsername(e.target.value)
            }}
            required
          />
          <AuthField
            label="EMAIL"
            type="email"
            placeholder="you@example.com"
            value={email}
            error={fieldErrors.email}
            onChange={(e) => {
              clearFieldError('email')
              setEmail(e.target.value)
            }}
            required
          />
          <AuthField
            label="PASSWORD"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            error={fieldErrors.password}
            onChange={(e) => {
              clearFieldError('password')
              setPassword(e.target.value)
            }}
            minLength={6}
            required
          />
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Continue'}
            <span className="auth-submit-glint" />
          </button>
        </form>

        <div className="auth-separator">
          <span>OR</span>
        </div>

        <GoogleAuthButton onError={(msg) => setError(msg)} />

        <div className="auth-divider" />
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

