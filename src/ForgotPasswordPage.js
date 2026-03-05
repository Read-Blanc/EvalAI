import { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginPage.css';
import './ForgotPasswordPage.css';

function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ask Supabase to send a password reset email.
    // redirectTo tells Supabase where to point the link in that email —
    // the user lands back here, Supabase appends a recovery token to the URL,
    // and onAuthStateChange fires with event PASSWORD_RECOVERY so App.js
    // can route them to the ResetPasswordPage.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    // Switch to the success state — hide the form, show the confirmation message
    setSent(true);
  };

  return (
    <div className="login-page">
      {/* Navbar — identical structure to LoginPage for visual consistency */}
      <nav className="navbar">
        <div className="nav-container">
          <div
            className="logo"
            onClick={() => onNavigate('landing')}
            style={{ cursor: 'pointer' }}
          >
            <div className="logo-icon">EvalAI</div>
          </div>
          <div className="nav-right">
            <p className="login-subtitle">
              Remember your password?{' '}
              <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>
                Sign in
              </a>
            </p>
          </div>
        </div>
      </nav>

      {/* Centered single-column card — simpler than the two-column login layout */}
      <div className="forgot-container">
        <div className="forgot-card">

          {sent ? (
            /* ── Success state ── shown after the email is dispatched */
            <div className="forgot-success">
              <div className="forgot-success-icon">✓</div>
              <h1 className="login-title">Check your email</h1>
              <p className="login-description">
                We sent a password reset link to <strong>{email}</strong>.
                Click the link in that email to choose a new password.
              </p>
              <p className="forgot-note">
                Didn't receive it? Check your spam folder, or{' '}
                <a
                  href="#resend"
                  className="signup-link"
                  onClick={(e) => { e.preventDefault(); setSent(false); }}
                >
                  try again
                </a>.
              </p>
              <button
                className="btn-login-submit"
                style={{ marginTop: '24px' }}
                onClick={() => onNavigate('login')}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* ── Request state ── the email input form */
            <>
              <h1 className="login-title">Forgot password?</h1>
              <p className="login-description">
                Enter the email address linked to your account and we'll send you
                a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-login-submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="signup-prompt" style={{ marginTop: '24px' }}>
                <a
                  href="#login"
                  className="signup-link"
                  onClick={(e) => { e.preventDefault(); onNavigate('login'); }}
                >
                  ← Back to Sign In
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
