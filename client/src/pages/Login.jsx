import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import AuthField from '../components/auth/AuthField.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import UsernameStep from '../components/auth/UsernameStep.jsx';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [oauthData, setOauthData] = useState(null);
  const [chosenUsername, setChosenUsername] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleRequiresUsername = (data) => {
    setOauthData(data);
    setChosenUsername(data.suggestedUsername || '');
  };

  const handleOAuthComplete = async (username) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.completeGoogleAuth({
        oauthToken: oauthData.oauthToken,
        username,
      });
      login(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to complete registration');
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-glow" />

        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {oauthData ? (
          <UsernameStep
            value={chosenUsername}
            onChange={(val) => {
              setChosenUsername(val);
              if (error) setError('');
            }}
            onSubmit={handleOAuthComplete}
            loading={loading}
            email={oauthData.email}
            avatar={oauthData.picture}
            title="Complete your profile"
            subtitle="Choose a unique username to finish signing in with Google."
            buttonText="Finish & Enter GLUG"
          />
        ) : (
          <div>
            <div className="auth-brand">
              <img src="/logo.png" alt="GLUG" className="auth-logo" />
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Log in to your GLUG community account.</p>
            </div>

            <form className="auth-form" onSubmit={submit} noValidate>
              <AuthField
                label="EMAIL ADDRESS"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="auth-field-wrap">
                <label className="auth-field-label">PASSWORD</label>
                <div className="auth-input-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Logging in…' : 'Log In'}
                <span className="auth-submit-glint" />
              </button>
            </form>

            <div className="auth-separator">
              <span>OR</span>
            </div>

            <GoogleAuthButton
              onError={(msg) => setError(msg)}
              onRequiresUsername={handleGoogleRequiresUsername}
            />

            <div className="auth-divider" />
            <p className="auth-footer">
              Need an account? <Link to="/register">Create an account</Link>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
