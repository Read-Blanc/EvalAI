import { useState } from 'react';
import { supabase } from './supabaseClient';
import './LoginPage.css';

function LoginPage({ onNavigate }) {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Authenticate with Supabase — replaces the previous dummy credential check
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    // Fetch the user's profile to get their role.
    // Primary source: profiles table (populated by the handle_new_user trigger on sign up).
    // Fallback: user_metadata set in supabase.auth.signUp() options.data —
    // used when the trigger hasn't run yet or there is no profile row for this user.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();

    const role     = profile?.role     ?? data.user.user_metadata?.role;
    const fullName = profile?.full_name ?? data.user.user_metadata?.full_name ?? '';

    setLoading(false);

    if (!role) {
      setError('Could not determine your role. Please contact support.');
      return;
    }

    // Pass user data to App.js for optimistic state update before
    // the onAuthStateChange listener fires and confirms the session.
    onNavigate('dashboard', {
      id: data.user.id,
      email: data.user.email,
      fullName,
      role,
    });
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
                New to EvalAI?{' '}
                <a href="#signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>
                  Create an account
                </a>
              </p>
          </div>
        </div>
      </nav>

      {/* Login Container */}
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-description">Sign in to access your assessments and dashboard</p>

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

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <div className="checkbox-group">
                <input
                  id="remember"
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="checkbox-label">Remember me</label>
              </div>
              <a
                href="#forgot"
                className="forgot-link"
                onClick={(e) => { e.preventDefault(); onNavigate('forgot-password'); }}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="form-divider">
            <span>Or continue with</span>
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
            Don't have an account?{' '}
            <a
              href="#signup"
              className="signup-link"
              onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}
            >
              Sign up here
            </a>
          </p>
        </div>

        <div className="login-side">
          <div className="side-content">
            <h2>Why choose EvalAI?</h2>
            <ul className="benefits-list">
              <li>Semantic understanding with SBERT technology</li>
              <li>Fair, transparent grading for all students</li>
              <li>Comprehensive analytics for educators</li>
              <li>Secure, reliable assessment platform</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
