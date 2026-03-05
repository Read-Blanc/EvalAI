import { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginPage.css';
import './ForgotPasswordPage.css';

function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side guard before touching the network
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // Update the credential on Supabase.
    // This works because Supabase automatically established a session from
    // the recovery token in the URL hash — onAuthStateChange (PASSWORD_RECOVERY)
    // fired before this page was rendered, so the SDK already holds the token.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // Sign out so the user starts a clean session with their new password.
    // onAuthStateChange will set user to null, then we navigate to login.
    await supabase.auth.signOut();

    setLoading(false);
    setSuccess(true);

    // Give the user a moment to read the confirmation, then send them to login
    setTimeout(() => onNavigate('login'), 2500);
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="nav-container">
          <div
            className="logo"
            onClick={() => onNavigate('landing')}
            style={{ cursor: 'pointer' }}
          >
            <div className="logo-icon">EvalAI</div>
          </div>
        </div>
      </nav>

      <div className="forgot-container">
        <div className="forgot-card">

          {success ? (
            /* ── Success state ── password has been updated */
            <div className="forgot-success">
              <div className="forgot-success-icon">✓</div>
              <h1 className="login-title">Password updated</h1>
              <p className="login-description">
                Your password has been changed successfully.
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            /* ── Form state ── let the user pick a new password */
            <>
              <h1 className="login-title">Set new password</h1>
              <p className="login-description">
                Choose a strong password — at least 8 characters.
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                  <label htmlFor="password" className="form-label">New Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm" className="form-label">Confirm Password</label>
                  <input
                    id="confirm"
                    type="password"
                    className="form-input"
                    placeholder="Re-enter your new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-login-submit" disabled={loading}>
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
