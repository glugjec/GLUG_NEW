import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import OtpInput from '../components/auth/OtpInput.jsx';
import UsernameStep from '../components/auth/UsernameStep.jsx';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  MailCheck,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  const [oauthData, setOauthData] = useState(null);

  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const clearFieldError = (f) => {
    if (fieldErrors[f]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[f];
        return next;
      });
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFieldErrors({ email: 'Email address is required' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'Password is required' });
      return;
    }
    if (password.length < 6) {
      setFieldErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp({ email: cleanEmail, purpose: 'register' });
      setResendCooldown(45);
      setStep(2);
    } catch (err) {
      const msg = err.message || 'Failed to send verification code';
      if (/email/i.test(msg)) {
        setFieldErrors({ email: msg });
      } else {
        setGlobalError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setGlobalError('');
    setLoading(true);
    try {
      await authApi.sendOtp({ email: email.trim().toLowerCase(), purpose: 'register' });
      setResendCooldown(45);
      setOtp('');
    } catch (err) {
      setGlobalError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (otp.length !== 6) {
      setGlobalError('Please enter all 6 digits of your verification code');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp({
        email: email.trim().toLowerCase(),
        otp,
        purpose: 'register',
      });
      setVerificationToken(res.verificationToken);
      const emailBase = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
      setUsername(emailBase.length >= 3 ? emailBase : `${emailBase}_user`);
      setStep(3);
    } catch (err) {
      setGlobalError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (chosenUsername) => {
    setGlobalError('');
    setLoading(true);
    try {
      if (oauthData) {
        const res = await authApi.completeGoogleAuth({
          oauthToken: oauthData.oauthToken,
          username: chosenUsername,
        });
        login(res.user, res.token);
        navigate('/');
      } else {
        const res = await authApi.register({
          username: chosenUsername,
          email: email.trim().toLowerCase(),
          password,
          verificationToken,
        });
        login(res.user, res.token);
        navigate('/');
      }
    } catch (err) {
      setGlobalError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRequiresUsername = (data) => {
    setOauthData(data);
    setEmail(data.email || '');
    setUsername(data.suggestedUsername || '');
    setStep(3);
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-glow" />

        <div className="auth-mode-switch">
          <Link to="/login" className="auth-mode-tab">
            Log In
          </Link>
          <button type="button" className="auth-mode-tab is-active">
            Create Account
          </button>
        </div>

        <div className="auth-step-progress">
          <div className={`auth-step-pill ${step >= 1 ? 'is-active' : ''} ${step > 1 ? 'is-done' : ''}`}>
            <span className="auth-step-num">{step > 1 ? <CheckCircle2 size={13} /> : '1'}</span>
            <span className="auth-step-name">Account</span>
          </div>
          <div className="auth-step-divider" />
          <div className={`auth-step-pill ${step >= 2 ? 'is-active' : ''} ${step > 2 ? 'is-done' : ''}`}>
            <span className="auth-step-num">{step > 2 ? <CheckCircle2 size={13} /> : '2'}</span>
            <span className="auth-step-name">Verify</span>
          </div>
          <div className="auth-step-divider" />
          <div className={`auth-step-pill ${step >= 3 ? 'is-active' : ''}`}>
            <span className="auth-step-num">3</span>
            <span className="auth-step-name">Username</span>
          </div>
        </div>

        {globalError && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{globalError}</span>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="auth-brand">
              <h2 className="auth-title">Create an account</h2>
              <p className="auth-subtitle">Sign up with your college email to join GLUG.</p>
            </div>

            <form className="auth-form" onSubmit={handleStep1Submit} noValidate>
              <div className="auth-field-wrap">
                <label className="auth-field-label">EMAIL ADDRESS</label>
                <div className="auth-input-relative">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className={`auth-input has-icon ${fieldErrors.email ? 'has-error' : ''}`}
                    placeholder="student@jec.ac.in"
                    value={email}
                    onChange={(e) => {
                      clearFieldError('email');
                      setEmail(e.target.value);
                    }}
                    required
                    autoFocus
                  />
                </div>
                {fieldErrors.email && (
                  <p className="auth-field-error-text">{fieldErrors.email}</p>
                )}
              </div>

              <div className="auth-field-wrap">
                <label className="auth-field-label">PASSWORD</label>
                <div className="auth-input-relative">
                  <span className="auth-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input has-icon ${fieldErrors.password ? 'has-error' : ''}`}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => {
                      clearFieldError('password');
                      setPassword(e.target.value);
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
                {fieldErrors.password && (
                  <p className="auth-field-error-text">{fieldErrors.password}</p>
                )}
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Sending verification code…' : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
                <span className="auth-submit-glint" />
              </button>
            </form>

            <div className="auth-separator">
              <span>OR SIGN UP WITH</span>
            </div>

            <GoogleAuthButton
              onError={(msg) => setGlobalError(msg)}
              onRequiresUsername={handleGoogleRequiresUsername}
            />

            <div className="auth-divider" />
            <p className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="auth-step-wrapper">
            <div className="auth-icon-badge">
              <MailCheck size={28} color="#3b82f6" />
            </div>

            <div className="auth-brand" style={{ marginBottom: '1.25rem' }}>
              <h2 className="auth-title">Verify your email</h2>
              <p className="auth-subtitle">
                We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="auth-otp-form">
              <div className="auth-otp-block">
                <OtpInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (globalError) setGlobalError('');
                  }}
                  disabled={loading}
                  error={Boolean(globalError)}
                />
              </div>

              <div className="auth-resend-row">
                {resendCooldown > 0 ? (
                  <span className="auth-resend-cooldown">
                    Resend code in <strong>{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    <RefreshCw size={13} /> Resend verification code
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={otp.length !== 6 || loading}
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
                <span className="auth-submit-glint" />
              </button>

              <button
                type="button"
                className="auth-back-btn"
                onClick={() => {
                  setStep(1);
                  setGlobalError('');
                }}
              >
                <ArrowLeft size={14} /> Change email address
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <UsernameStep
            value={username}
            onChange={(val) => {
              setUsername(val);
              if (globalError) setGlobalError('');
            }}
            onSubmit={handleFinalSubmit}
            loading={loading}
            email={email}
            avatar={oauthData?.picture}
            title={oauthData ? 'Welcome to GLUG!' : 'Choose your username'}
            subtitle="Pick your unique handle to participate in discussions and projects."
            buttonText={oauthData ? 'Complete Google Sign Up' : 'Create GLUG Account'}
          />
        )}
      </div>
    </AuthLayout>
  );
}
