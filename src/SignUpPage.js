import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import "./LoginPage.css";

function SignUpPage({ onNavigate }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      onNavigate("dashboard", { email, role, fullName });
    } else {
      setSuccess(
        "Account created! Check your email and click the verification link to activate your account.",
      );
    }
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
              Already have an account?{" "}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("login");
                }}
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </nav>

      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Create an account</h1>
          <p className="login-description">
            Join EvalAI to access intelligent, SBERT-powered assessments and
            grading.
          </p>

          {success ? (
            <div
              style={{
                padding: "20px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "6px",
                color: "#166534",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              <strong>Almost there!</strong>
              <br />
              {success}
              <br />
              <br />
              <button
                className="btn-login-submit"
                onClick={() => onNavigate("login")}
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
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
                <label htmlFor="role" className="form-label">
                  I am a
                </label>
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
                <label htmlFor="password" className="form-label">
                  Password
                </label>
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
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
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
                    I agree to the{" "}
                    <a href="#terms" className="signup-link">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#privacy" className="signup-link">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn-login-submit"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          {!success && (
            <>
              <div className="form-divider">
                <span>Or sign up with</span>
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
                Already have an account?{" "}
                <a
                  href="#login"
                  className="signup-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("login");
                  }}
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
