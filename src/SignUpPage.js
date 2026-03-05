import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginPage.css'; // Reuses the identical layout and form styles from the login page

function SignUpPage({ onNavigate }) {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole]                       = useState('student');
  const [agreedToTerms, setAgreedToTerms]     = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const [loading, setLoading]                 = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation before hitting Supabase
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service to create an account.');
      return;
    }

    setLoading(true);

    // Create the auth user in Supabase.
    // The `data` payload (full_name, role) is stored as user metadata and
    // picked up by the `handle_new_user` database trigger to populate the profiles table.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      // Email confirmation is disabled in Supabase — user is immediately signed in.
      // onAuthStateChange in App.js will pick up the session and hydrate user state.
      onNavigate('dashboard', { email, role, fullName });
    } else {
      // Email confirmation is enabled (Supabase default) — user must verify before signing in.
      setSuccess('Account created! Check your email and click the verification link to activate your account.');
    }
  };

  return (
    <div className="login-page">
      {/* Navigation Header */}
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
              Already have an account?{' '}
              <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>
                Sign in
              </a>
            </p>
          </div>
        </div>
      </nav>

      {/* Sign Up Container */}
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Create an Account</h1>
          <p className="login-description">
            Join EvalAI to access intelligent, SBERT-powered assessments and grading.
          </p>

          {/* Success state — shown after sign up when email confirmation is required */}
          {success ? (
            <div style={{ padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#166534', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>Almost there!</strong><br />{success}
              <br /><br />
              <button
                className="btn-login-submit"
                onClick={() => onNavigate('login')}
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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

              <div className="form-group">
                <label htmlFor="role" className="form-label">I am a</label>
                <select
                  id="role"
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-options">
                <div className="checkbox-group">
                  <input
                    id="terms"
                    type="checkbox"
                    className="checkbox-input"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <label htmlFor="terms" className="checkbox-label">
                    I agree to the{' '}
                    <a href="#terms" className="signup-link">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#privacy" className="signup-link">Privacy Policy</a>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-login-submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          {!success && (
            <>
              <div className="form-divider">
                <span>Or sign up with</span>
              </div>

              <div className="social-login">
                <button type="button" className="btn-social">
                  <span>Google</span>
                </button>
                <button type="button" className="btn-social">
                  <span>Microsoft</span>
                </button>
              </div>

              <p className="signup-prompt">
                Already have an account?{' '}
                <a
                  href="#login"
                  className="signup-link"
                  onClick={(e) => { e.preventDefault(); onNavigate('login'); }}
                >
                  Sign in here
                </a>
              </p>
            </>
          )}
        </div>

        <div className="login-side">
          <div className="side-content">
            <h2>Join thousands using EvalAI</h2>
            <ul className="benefits-list">
              <li>AI-powered grading with SBERT semantic understanding</li>
              <li>Instant, consistent feedback for every submission</li>
              <li>Detailed analytics to track progress over time</li>
              <li>Secure platform built for academic integrity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
