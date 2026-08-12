import { useState } from 'react'

export default function AuthField({ label, hint, type = 'text', ...props }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="auth-field">
      <label className="auth-label">
        {label} <span className="auth-required">*</span>
      </label>
      <div className="auth-input-wrap">
        <input
          type={isPassword && visible ? 'text' : type}
          className="auth-input"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye"
            onClick={() => setVisible(!visible)}
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M2 5.27 3.28 4 20 20.72 18.73 22l-3.08-3.08A10.7 10.7 0 0 1 12 19.5C7 19.5 2.73 16.44 1 12c.74-1.76 1.93-3.3 3.42-4.48L2 5.27ZM12 9a3 3 0 0 1 3 3c0 .34-.06.66-.17.96L9.04 7.17A3 3 0 0 1 12 9Zm8.23 1.94C18.86 13.04 15.65 16.5 12 16.5a4.9 4.9 0 0 1-1.91-.39l-1.7 1.7A10.9 10.9 0 0 0 12 19.5c5 0 9.27-3.06 11-7.5a11.1 11.1 0 0 0-2.77-3.06Zm-6.2-3.33-1.92 1.92A3 3 0 0 0 9.47 9 3 3 0 0 1 12 6.5c.39 0 .76.07 1.03.11Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.56 1 12c1.73 4.44 6 7.5 11 7.5s9.27-3.06 11-7.5c-1.73-4.44-6-7.5-11-7.5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <p className="auth-hint">{hint}</p>}
    </div>
  )
}