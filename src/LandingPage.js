import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './LandingPage.css';

const ROTATING_WORDS = [
  'understands meaning',
  'grades fairly',
  'gives instant feedback',
  'scales with you',
  'thinks like a lecturer',
];

function LandingPage({ onNavigate }) {
  const [wordIndex, setWordIndex]   = useState(0);
  const [animating, setAnimating]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Rotate hero word every 2.6s
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length);
        setAnimating(false);
      }, 350);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error('Google sign in error:', error);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="landing-page">

      {/* Navbar */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo">EvalAI</div>
          <ul className="lp-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#support">Support</a></li>
          </ul>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={() => onNavigate('login')}>Log in</button>
            <button className="lp-btn-dark" onClick={() => onNavigate('signup')}>Get started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">SBERT · Semantic AI · Supabase</div>

          <h1 className="lp-hero-title">
            Assessment that
            <span className={`lp-hero-word ${animating ? 'lp-word-exit' : 'lp-word-enter'}`}>
              {ROTATING_WORDS[wordIndex]}
            </span>
          </h1>

          <p className="lp-hero-sub">
            EvalAI uses Sentence-BERT to evaluate theory answers based on semantic
            understanding — not keyword matching. Lecturers review AI suggestions,
            students get instant feedback.
          </p>

          <div className="lp-hero-cta">
            <button className="lp-btn-dark lp-btn-lg" onClick={() => onNavigate('signup')}>
              Start for free
            </button>
            <button className="lp-btn-ghost lp-btn-lg" onClick={() => onNavigate('login')}>
              Sign in →
            </button>
          </div>

          {/* Stats */}
          <div className="lp-stats">
            {[
              { v: '< 30s', l: 'per submission' },
              { v: 'SBERT', l: 'semantic model' },
              { v: '2 roles', l: 'student & lecturer' },
              { v: '100%', l: 'lecturer control' },
            ].map((s, i) => (
              <div key={i} className="lp-stat">
                <span className="lp-stat-v">{s.v}</span>
                <span className="lp-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="lp-roles">
        <div className="lp-roles-inner">

          <div className="lp-role-card lp-role-light">
            <img src="/studenticon.avif" alt="Student" className="lp-role-icon" />
            <div className="lp-role-tag">For Students</div>
            <h2 className="lp-role-title">Take assessments.<br />See your progress.</h2>
            <p className="lp-role-desc">
              Join with an access code, submit answers, and receive AI-powered
              feedback the moment your work is graded.
            </p>
            <ul className="lp-role-list">
              <li>Access active assessments with a lecturer-shared code</li>
              <li>View rubric scores, reference answers, and AI similarity</li>
              <li>Track performance trends over time</li>
            </ul>
            <button className="lp-role-btn lp-role-btn-dark" onClick={() => onNavigate('signup')}>
              Create student account →
            </button>
          </div>

          <div className="lp-role-card lp-role-dark">
            <img src="/lecturericon.jpg" alt="Lecturer" className="lp-role-icon lp-role-icon-dark" />
            <div className="lp-role-tag lp-role-tag-light">For Lecturers</div>
            <h2 className="lp-role-title lp-role-title-light">Create. Grade.<br />Analyse at scale.</h2>
            <p className="lp-role-desc lp-role-desc-light">
              Build assessments with sample answers, let AI suggest marks,
              then approve or override in one click.
            </p>
            <ul className="lp-role-list lp-role-list-light">
              <li>Publish with a shareable access code</li>
              <li>AI grading queue with bulk approve</li>
              <li>Class analytics and score distribution</li>
            </ul>
            <button className="lp-role-btn lp-role-btn-light" onClick={() => onNavigate('signup')}>
              Create lecturer account →
            </button>
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="lp-how" id="how">
        <div className="lp-how-inner">
          <div className="lp-section-label">How it works</div>
          <h2 className="lp-section-title">From submission to grade in seconds</h2>

          <div className="lp-steps">
            {[
              { n: '01', title: 'Lecturer creates assessment', desc: 'Define questions, set marks, and write a sample answer per question. Publish with a generated access code.' },
              { n: '02', title: 'Student submits answers',      desc: 'Students join with the access code and type their answers directly in the browser. No account setup required.' },
              { n: '03', title: 'AI scores semantically',       desc: 'SBERT computes cosine similarity between student answers and the reference. Scores are suggested instantly.' },
              { n: '04', title: 'Lecturer reviews & approves',  desc: 'Accept AI suggestions, adjust individual marks, or grade manually. Full control stays with the lecturer.' },
            ].map(s => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="lp-features" id="features">
        <div className="lp-features-inner">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-title">Everything you need for fair evaluation</h2>

          <div className="lp-features-grid">
            {[
              { icon: '⬡', title: 'Semantic grading',       desc: 'SBERT understands context. A correct answer phrased differently still scores correctly — no keyword gaming.' },
              { icon: '⬡', title: 'Instant feedback',       desc: 'Students see their score, AI similarity %, and reference answer the moment grading completes.' },
              { icon: '⬡', title: 'Lecturer control',       desc: 'Every AI score is a suggestion. Accept, adjust, or manually override — always your decision.' },
              { icon: '⬡', title: 'Access code system',     desc: 'No complex enrolment. Share a code, students join instantly. Works on any device.' },
              { icon: '⬡', title: 'Analytics dashboard',    desc: 'Score distribution, class averages, per-question breakdown, and AI vs manual comparison.' },
              { icon: '⬡', title: 'Realtime notifications', desc: 'Lecturers are notified when submissions arrive. Students are notified when grading completes.' },
            ].map(f => (
              <div key={f.title} className="lp-feature">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="lp-cta-strip">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to grade smarter?</h2>
          <p className="lp-cta-sub">Free to use. No credit card required.</p>
          <div className="lp-cta-actions">
            <button className="lp-btn-dark lp-btn-lg" onClick={() => onNavigate('signup')}>
              Create your account
            </button>
            <button
              className="lp-btn-google lp-btn-lg"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8, flexShrink: 0 }}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-logo">EvalAI</span>
          <span className="lp-footer-copy">© 2026 EvalAI · Built with SBERT &amp; Supabase</span>
          <div className="lp-footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;