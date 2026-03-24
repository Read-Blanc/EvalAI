import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./LoginPage.css";

function LoginPage({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      { email, password },
    );

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role ?? data.user.user_metadata?.role;
    const fullName =
      profile?.full_name ?? data.user.user_metadata?.full_name ?? "";

    setLoading(false);

    if (!role) {
      setError("Could not determine your role. Please contact support.");
      return;
    }

    onNavigate("dashboard", {
      id: data.user.id,
      email: data.user.email,
      fullName,
      role,
    });
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="nav-container">
          <div
            className="logo"
            onClick={() => onNavigate("landing")}
            style={{ cursor: "pointer" }}
          >
            <div className="logo-icon">EvalAI</div>
          </div>
          <div className="nav-right">
            <p className="login-subtitle">
              New to EvalAI?{" "}
              <a
                href="#signup"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("signup");
                }}
              >
                Create an account
              </a>
            </p>
          </div>
        </div>
      </nav>

      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-description">
            Sign in to access your assessments and dashboard
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
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
              <label htmlFor="password" className="form-label">
                Password
              </label>
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
                <label htmlFor="remember" className="checkbox-label">
                  Remember me
                </label>
              </div>
              <a
                href="#forgot"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("forgot-password");
                }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="form-divider">
            <span>Or continue with</span>
          </div>

          <button
            type="button"
            className="btn-google-full"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="signup-prompt">
            Don't have an account?{" "}
            <a
              href="#signup"
              className="signup-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("signup");
              }}
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
