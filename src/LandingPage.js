import React from 'react';
import './LandingPage.css';

function LandingPage({ onNavigate }) {
  const handleGetStarted = () => {
    // Navigate to dashboard or signup
    window.location.href = '/dashboard';
  };

  const handleStudentClick = () => {
    // Navigate to student assessments
    window.location.href = '/student-assessments';
  };

  const handleLecturerClick = () => {
    // Navigate to lecturer dashboard
    window.location.href = '/lecturer-dashboard';
  };

  const handleLoginClick = () => {
    // Navigate to login page
    onNavigate('login');
  };

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <div className="logo-icon">EvalAI</div>
          </div>
          <ul className="nav-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#analytics">Analytics</a></li>
            <li><a href="#support">Support</a></li>
          </ul>
          <div className="nav-buttons">
            <button className="btn-login" onClick={handleLoginClick}>Log In</button>
            <button className="btn-get-started" onClick={handleGetStarted}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Interactive, SBERT-powered assessment</div>
          <h1 className="hero-title">Intelligent Assessment<br />Beyond Keywords</h1>
          <p className="hero-description">
            EvalAI uses Sentence-BERT to evaluate theory answers based on meaning, not just keyword matching.
          </p>
          <p className="hero-subtext">
            Buttons, toolips, and role-specific sections are designed to stay clear and readable on desktops, tablets, and mobile devices.
          </p>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="role-section">
        <div className="role-container">
          {/* Student Card */}
          <div className="role-card student-card">
            <img src="/studenticon.avif" alt="Student" className="role-icon" />
            <h2 className="role-title">I am a Student</h2>
            <p className="role-description">
              Personalized workspace with assessments and feedback tailored to you.
            </p>
            <ul className="role-features">
              <li>Access upcoming assessments, see rubric-based scores for assignments you've completed, and review detailed feedback that explains how your answers were evaluated.</li>
            </ul>
            <button className="btn-primary" onClick={handleStudentClick}>Go to Assessments</button>
            <a href="#results" className="secondary-link">View Past Results</a>
            <p className="role-footnote">Tip: After you sign in, this area updates with your active and completed assessments.</p>
          </div>

          {/* Lecturer Card */}
          <div className="role-card lecturer-card">
            <img src="/lecturericon.jpg" alt="Lecturer" className="role-icon" />
            <h2 className="role-title">I am a Lecturer</h2>
            <p className="role-description">
              Role-aware dashboard for question design, grading, and analytics.
            </p>
            <ul className="role-features">
              <li>Create and manage question banks, configure rubrics, and monitor automated grading at scale. Drill into cohort performance with analytics designed for secure, evidence-based evaluation.</li>
            </ul>
            <button className="btn-primary" onClick={handleLecturerClick}>Manage Assessments</button>
            <a href="#analytics" className="secondary-link">View Class Analytics</a>
            <p className="role-footnote">Tip: Once authenticated, you'll have course-specific analytics and board activity here.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <h2 className="features-title">Trustworthy Automated Evaluation</h2>
          <p className="features-subtitle">Built for accuracy, transparency, and academic integrity.</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Semantic Analysis</h3>
              <p>Uses SBERT to understand the context and meaning of answers, ensuring grades reflect true understanding.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Rubric-based Scoring</h3>
              <p>Evaluates against specific criteria like accuracy, completeness, and clarity for consistent, fair results.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Detailed Feedback</h3>
              <p>Generates constructive feedback automatically, helping students learn from their mistakes immediately.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Performance Analytics</h3>
              <p>Track progress over time with comprehensive dashboards for both individual students and entire classes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 EvalAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
