import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./LandingPage.css";

/* ── Typing headline ── */
const TYPING_WORDS = ["Meaning", "Context", "Concepts", "Understanding"];

function TypingWord() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = TYPING_WORDS[wordIdx];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(
        () => setDisplayed(word.slice(0, displayed.length + 1)),
        80,
      );
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % TYPING_WORDS.length);
    }
  }, [displayed, deleting, wordIdx]);

  return (
    <span className="lp-typing-word">
      <span className="lp-typing-text">{displayed}</span>
      <span className="lp-typing-cursor" />
    </span>
  );
}

export default function LandingPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error("Google sign in error:", error);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="lp-page">
      {/* ── Navbar ── */}
      <nav className={`lp-nav ${scrolled ? "lp-nav-scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <button className="lp-logo" onClick={() => onNavigate("landing")}>
            <div className="lp-logo-icon">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <span className="lp-logo-text">EvalAI</span>
          </button>

          <ul className="lp-nav-links">
            {[
              ["Features", "#features"],
              ["How it works", "#how"],
              ["About", "#about"],
            ].map(([label, href]) => (
              <li key={label}>
                <a href={href} className="lp-nav-link">
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="lp-nav-actions">
            <button
              className="lp-btn-ghost"
              onClick={() => onNavigate("login")}
            >
              Log In
            </button>
            <button
              className="lp-btn-dark"
              onClick={() => onNavigate("signup")}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge hero-1">
            <span className="lp-badge-dot" />
            SBERT · Semantic AI · Supabase
          </div>

          <h1 className="lp-hero-title hero-2">
            Grading that understands
            <br />
            <TypingWord />
          </h1>

          <p className="lp-hero-sub hero-3">
            EvalAI uses Sentence-BERT to evaluate theory answers based on
            semantic understanding — not keyword matching. Lecturers review AI
            suggestions, students get instant feedback.
          </p>

          <div className="lp-hero-cta hero-4">
            <button
              className="lp-btn-dark lp-btn-lg"
              onClick={() => onNavigate("signup")}
            >
              Start for free →
            </button>
            <button
              className="lp-btn-outline lp-btn-lg"
              onClick={() => onNavigate("login")}
            >
              Sign in
            </button>
          </div>

          <div className="lp-stats hero-5">
            {[
              { v: "< 30s", l: "per submission" },
              { v: "SBERT", l: "semantic model" },
              { v: "2 roles", l: "student & lecturer" },
              { v: "100%", l: "lecturer control" },
            ].map((s) => (
              <div key={s.l} className="lp-stat">
                <span className="lp-stat-v">{s.v}</span>
                <span className="lp-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Cards ── */}
      <section className="lp-roles" id="about">
        <div className="lp-roles-inner">
          {/* Student card */}
          <div className="lp-role-card lp-role-light">
            <img
              src="/studenticon.avif"
              alt="Student"
              className="lp-role-icon"
            />
            <span className="lp-role-tag">For Students</span>
            <h2 className="lp-role-title">
              Take assessments.
              <br />
              See your progress.
            </h2>
            <p className="lp-role-desc">
              Join with an access code, submit answers, and receive AI-powered
              feedback the moment your work is graded.
            </p>
            <ul className="lp-role-list">
              {[
                "Access active assessments with a lecturer-shared code",
                "View rubric scores, reference answers, and AI similarity",
                "Track performance trends over time",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              className="lp-role-btn lp-role-btn-dark"
              onClick={() => onNavigate("signup")}
            >
              Create student account →
            </button>
          </div>

          {/* Lecturer card */}
          <div className="lp-role-card lp-role-dark">
            <img
              src="/lecturericon.jpg"
              alt="Lecturer"
              className="lp-role-icon lp-role-icon-dark"
            />
            <span className="lp-role-tag lp-role-tag-dark">For Lecturers</span>
            <h2 className="lp-role-title lp-role-title-dark">
              Create. Grade.
              <br />
              Analyse at scale.
            </h2>
            <p className="lp-role-desc lp-role-desc-dark">
              Build assessments with sample answers, let AI suggest marks, then
              approve or override in one click.
            </p>
            <ul className="lp-role-list lp-role-list-dark">
              {[
                "Publish with a shareable access code",
                "AI grading queue with bulk approve",
                "Class analytics and score distribution",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              className="lp-role-btn lp-role-btn-light"
              onClick={() => onNavigate("signup")}
            >
              Create lecturer account →
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-how" id="how">
        <div className="lp-how-inner">
          <div className="lp-section-label">How it works</div>
          <h2 className="lp-section-title">
            From submission to grade in seconds
          </h2>
          <div className="lp-steps">
            {[
              {
                n: "01",
                title: "Lecturer creates assessment",
                desc: "Define questions, set marks, and write a sample answer per question. Publish with a generated access code.",
              },
              {
                n: "02",
                title: "Student submits answers",
                desc: "Students join with the access code and type their answers directly in the browser.",
              },
              {
                n: "03",
                title: "AI scores semantically",
                desc: "SBERT computes cosine similarity between student answers and the reference. Scores are suggested instantly.",
              },
              {
                n: "04",
                title: "Lecturer reviews and approves",
                desc: "Accept AI suggestions, adjust individual marks, or grade manually. Full control stays with the lecturer.",
              },
            ].map((step, i, arr) => (
              <div
                key={step.n}
                className={`lp-step ${i < arr.length - 1 ? "lp-step-bordered" : ""}`}
              >
                <span className="lp-step-num">{step.n}</span>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        <div className="lp-features-inner">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-title">
            Everything you need for fair evaluation
          </h2>
          <div className="lp-features-grid">
            {[
              {
                title: "Semantic grading",
                desc: "SBERT understands context. A correct answer phrased differently still scores correctly — no keyword gaming.",
              },
              {
                title: "Instant feedback",
                desc: "Students see their score, AI similarity %, and reference answer the moment grading completes.",
              },
              {
                title: "Lecturer control",
                desc: "Every AI score is a suggestion. Accept, adjust, or manually override — always your decision.",
              },
              {
                title: "Access code system",
                desc: "No complex enrolment. Share a code, students join instantly. Works on any device.",
              },
              {
                title: "Analytics dashboard",
                desc: "Score distribution, class averages, per-question breakdown, and AI vs manual comparison.",
              },
              {
                title: "Realtime notifications",
                desc: "Lecturers are notified when submissions arrive. Students are notified when grading completes.",
              },
            ].map((f) => (
              <div key={f.title} className="lp-feature">
                <div className="lp-feature-icon-box" />
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ── */}
      <section className="lp-cta-strip">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to grade smarter?</h2>
          <p className="lp-cta-sub">Free to use. No credit card required.</p>
          <div className="lp-cta-actions">
            <button
              className="lp-btn-cta-primary"
              onClick={() => onNavigate("signup")}
            >
              Create your account
            </button>
            <button
              className="lp-btn-cta-google"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <svg
                width="16"
                height="16"
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
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo-wrap">
            <div className="lp-footer-logo-icon">
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <span className="lp-footer-logo-text">EvalAI</span>
          </div>
          <span className="lp-footer-copy">
            © 2026 EvalAI · Built with SBERT &amp; Supabase
          </span>
          <div className="lp-footer-links">
            {["Privacy", "Terms", "Support"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="lp-footer-link"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
