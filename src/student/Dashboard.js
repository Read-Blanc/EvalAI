import React from 'react';
import { useUser } from '../UserContext';
import '../lecturer/DashboardPage.css';

// ── Mock data ──────────────────────────────────────────────────────────────
const STATS = [
  {
    label:     'Completed',
    value:     '3',
    delta:     '+1 this week',
    deltaType: 'up',
    icon:      '✅',
    accent:    '#10b981',
  },
  {
    label:     'Avg. Score',
    value:     '78%',
    delta:     '+3% vs last assessment',
    deltaType: 'up',
    icon:      '📊',
    accent:    'linear-gradient(90deg,#667eea,#764ba2)',
  },
  {
    label:     'Available',
    value:     '2',
    delta:     '1 closing this week',
    deltaType: null,
    icon:      '📋',
    accent:    '#3b82f6',
  },
  {
    label:     'Pending Review',
    value:     '1',
    delta:     'Submitted yesterday',
    deltaType: null,
    icon:      '⏳',
    accent:    '#f59e0b',
  },
];

const UPCOMING = [
  {
    id:        'A001',
    title:     'CS-401 Midterm',
    topic:     'Theory of Computation',
    questions: 5,
    maxMarks:  100,
    due:       'Mar 1',
    urgency:   'high',
  },
  {
    id:        'A005',
    title:     'CS-501 Assignment',
    topic:     'Machine Learning',
    questions: 2,
    maxMarks:  50,
    due:       'Mar 5',
    urgency:   'low',
  },
];

const RECENT_RESULTS = [
  { id: 'A003', title: 'CS-201 Final',  topic: 'Algorithms',      score: 0.82, maxMarks: 150, color: '#667eea' },
  { id: 'A002', title: 'CS-301 Quiz 2', topic: 'Data Structures', score: 0.74, maxMarks: 30,  color: '#10b981' },
  { id: 'A004', title: 'CS-401 Quiz 1', topic: 'Automata Theory', score: 0.91, maxMarks: 40,  color: '#3b82f6' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreClass(s) {
  if (s >= 0.85) return 'dash-score-high';
  if (s >= 0.65) return 'dash-score-mid';
  return 'dash-score-low';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// ── Component ──────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const { user } = useUser();
  const firstName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div>
      {/* Sticky topbar */}
      <div className="dash-topbar">
        <div className="dash-breadcrumb">
          <span>Home</span>
          <span className="sep">/</span>
          <span>Dashboard</span>
        </div>
        <div className="dash-topbar-actions">
          <button className="dash-notif-btn" title="Notifications">
            🔔
            <span className="dash-notif-dot" />
          </button>
          <button className="dash-btn-primary" onClick={() => onNavigate('student-assessments')}>
            Take Assessment
          </button>
        </div>
      </div>

      {/* Page body */}
      <div className="dash-content">

        {/* Welcome */}
        <div className="dash-welcome">
          <div className="dash-welcome-greeting">Good {greeting()}, {firstName}</div>
          <div className="dash-welcome-sub">Here's a summary of your assessments and recent performance.</div>
          <div className="dash-welcome-date">{today}</div>
        </div>

        {/* Stat cards */}
        <div className="dash-stats-row">
          {STATS.map((s) => (
            <div key={s.label} className="dash-stat-card">
              <div className="dash-stat-accent" style={{ background: s.accent }} />
              <div className="dash-stat-icon">{s.icon}</div>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-delta">
                {s.deltaType === 'up'   && <span className="up">↑ </span>}
                {s.deltaType === 'down' && <span className="down">↓ </span>}
                {s.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Main 2-column grid */}
        <div className="dash-grid-2">

          {/* Available Assessments snapshot */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Available Assessments</div>
                <div className="dash-card-subtitle">Assessments you can take now</div>
              </div>
              <a
                className="dash-card-action"
                href="#student-assessments"
                onClick={(e) => { e.preventDefault(); onNavigate('student-assessments'); }}
              >
                View all →
              </a>
            </div>

            {UPCOMING.map((item) => (
              <div
                key={item.id}
                className="dash-queue-item"
                onClick={() => onNavigate('student-assessments')}
              >
                <div
                  className="dash-queue-avatar"
                  style={{ background: item.urgency === 'high' ? '#ef4444' : '#3b82f6', fontSize: '16px' }}
                >
                  📋
                </div>
                <div className="dash-queue-info">
                  <div className="dash-queue-name">{item.title}</div>
                  <div className="dash-queue-meta">
                    {item.topic} · {item.questions} questions · {item.maxMarks} marks
                  </div>
                </div>
                <div className="dash-deadline-meta">
                  <div className="dash-deadline-time">Due {item.due}</div>
                  <div className="dash-deadline-sub">{item.urgency === 'high' ? 'Soon' : 'Upcoming'}</div>
                </div>
              </div>
            ))}

            <div style={{ padding: '14px 20px', borderTop: '1px solid #e0e0e0' }}>
              <button
                className="dash-btn-primary"
                style={{ width: '100%' }}
                onClick={() => onNavigate('student-assessments')}
              >
                Start an Assessment
              </button>
            </div>
          </div>

          {/* Recent Results */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Recent Results</div>
                <div className="dash-card-subtitle">Your latest graded submissions</div>
              </div>
              <a
                className="dash-card-action"
                href="#student-assessments"
                onClick={(e) => { e.preventDefault(); onNavigate('student-assessments'); }}
              >
                View all →
              </a>
            </div>

            {RECENT_RESULTS.map((item) => (
              <div key={item.id} className="dash-queue-item">
                <div className="dash-queue-avatar" style={{ background: item.color }}>
                  {item.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="dash-queue-info">
                  <div className="dash-queue-name">{item.title}</div>
                  <div className="dash-queue-meta">{item.topic} · {item.maxMarks} marks</div>
                </div>
                <div className={`dash-queue-score ${scoreClass(item.score)}`}>
                  {Math.round(item.score * 100)}%
                </div>
                <span className="dash-status-chip dash-chip-reviewed">Graded</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-card" style={{ marginTop: '16px', animation: 'dashFadeUp 0.5s 0.25s ease both' }}>
          <div className="dash-card-header">
            <div className="dash-card-title">Quick Actions</div>
          </div>
          <div className="dash-qa-grid">
            {[
              { icon: '📝', label: 'Take Assessment', desc: 'Start an available test',  page: 'student-assessments' },
              { icon: '📄', label: 'Past Results',    desc: 'View graded submissions',  page: 'student-assessments' },
              { icon: '📈', label: 'Analytics',       desc: 'Your performance trends',  page: 'student-analytics'   },
              { icon: '🔔', label: 'Notifications',   desc: 'Grades & announcements',   page: 'student-dashboard'   },
            ].map((qa) => (
              <button
                key={qa.label}
                className="dash-qa-btn"
                onClick={() => onNavigate(qa.page)}
              >
                <div className="dash-qa-icon" style={{ background: '#f0f0f0' }}>
                  {qa.icon}
                </div>
                <div>
                  <div className="dash-qa-label">{qa.label}</div>
                  <div className="dash-qa-desc">{qa.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
