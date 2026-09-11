import { useState, useEffect, useRef } from 'react';
import { authApi } from '../../api.js';
import { CheckCircle2, AlertCircle, Loader2, AtSign } from 'lucide-react';

export default function UsernameStep({
  value,
  onChange,
  onSubmit,
  loading = false,
  email = '',
  avatar = '',
  title = 'Choose your GLUG Username',
  subtitle = 'Pick a unique handle visible to all members across discussions.',
  buttonText = 'Complete Registration',
}) {
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const timerRef = useRef(null);

  const clean = (value || '').trim();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!clean) {
      setStatus({ state: 'idle', message: '' });
      return;
    }

    if (clean.length < 3) {
      setStatus({ state: 'error', message: 'Username must be at least 3 characters' });
      return;
    }

    if (clean.length > 30) {
      setStatus({ state: 'error', message: 'Username cannot exceed 30 characters' });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setStatus({ state: 'error', message: 'Only letters, numbers, and underscores allowed' });
      return;
    }

    setStatus({ state: 'checking', message: 'Checking availability…' });

    timerRef.current = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(clean);
        if (res?.available) {
          setStatus({ state: 'available', message: 'Username is available!' });
        } else {
          setStatus({ state: 'error', message: res?.message || 'Username already taken' });
        }
      } catch (err) {
        setStatus({ state: 'error', message: err.message || 'Error checking username' });
      }
    }, 350);

    return () => clearTimeout(timerRef.current);
  }, [clean]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status.state !== 'available' || loading) return;
    onSubmit(clean);
  };

  const suggestions = [];
  if (email) {
    const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 18);
    if (base && base !== clean) {
      suggestions.push(base);
      suggestions.push(`${base}_dev`);
      suggestions.push(`${base}_glug`);
    }
  }

  return (
    <form className="auth-username-form" onSubmit={handleSubmit}>
      {avatar && (
        <div className="auth-user-preview">
          <img src={avatar} alt="Profile" className="auth-user-preview-avatar" />
          <span className="auth-user-preview-email">{email}</span>
        </div>
      )}

      <div className="auth-step-header">
        <h2 className="auth-step-title">{title}</h2>
        <p className="auth-step-desc">{subtitle}</p>
      </div>

      <div className="auth-field-group">
        <label className="auth-field-label">USERNAME</label>
        <div className="auth-input-affix-wrap">
          <span className="auth-input-affix">
            <AtSign size={16} />
          </span>
          <input
            type="text"
            className={`auth-input has-affix ${
              status.state === 'available' ? 'is-valid' : status.state === 'error' ? 'has-error' : ''
            }`}
            placeholder="choose_username"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={30}
            autoFocus
            required
            disabled={loading}
          />
          <div className="auth-input-status-icon">
            {status.state === 'checking' && <Loader2 size={16} className="spin-icon text-muted" />}
            {status.state === 'available' && <CheckCircle2 size={16} color="#10b981" />}
            {status.state === 'error' && <AlertCircle size={16} color="#ef4444" />}
          </div>
        </div>

        {status.message && (
          <p
            className={`auth-field-status-text ${
              status.state === 'available' ? 'is-success' : status.state === 'error' ? 'is-error' : ''
            }`}
          >
            {status.message}
          </p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="auth-suggestions-box">
          <span className="auth-suggestions-title">Suggestions:</span>
          <div className="auth-suggestions-chips">
            {suggestions.slice(0, 3).map((sugg) => (
              <button
                key={sugg}
                type="button"
                className="auth-suggestion-chip"
                onClick={() => onChange(sugg)}
              >
                @{sugg}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="auth-submit"
        disabled={status.state !== 'available' || loading}
      >
        {loading ? 'Finalizing…' : buttonText}
        <span className="auth-submit-glint" />
      </button>
    </form>
  );
}
