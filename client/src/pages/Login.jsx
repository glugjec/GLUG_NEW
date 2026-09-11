import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import UsernameStep from '../components/auth/UsernameStep.jsx';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
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
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({ email: cleanEmail, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
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

        <div className="auth-mode-switch">
          <button type="button" className="auth-mode-tab is-active">
            Log In
          </button>
          <Link to="/register" className="auth-mode-tab">
            Create Account
          </Link>
        </div>

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
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Log in with your email or Google account.</p>
            </div>

            <form className="auth-form" onSubmit={submit} noValidate>
              <div className="auth-field-wrap">
                <label className="auth-field-label">EMAIL ADDRESS</label>
                <div className="auth-input-relative">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="auth-input has-icon"
                    placeholder="student@jec.ac.in"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-field-wrap">
                <div className="auth-label-row">
                  <label className="auth-field-label">PASSWORD</label>
                  <Link to="/forgot-password" className="auth-forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-relative">
                  <span className="auth-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input has-icon"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
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
                {loading ? 'Signing in…' : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
                <span className="auth-submit-glint" />
              </button>
            </form>

            <div className="auth-separator">
              <span>OR CONTINUE WITH</span>
            </div>

            <GoogleAuthButton
              onError={(msg) => setError(msg)}
              onRequiresUsername={handleGoogleRequiresUsername}
            />

            <div className="auth-divider" />
            <p className="auth-footer">
              New to GLUG? <Link to="/register">Create an account</Link>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
