import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import './ResultDetail.css';

// ── Circular progress ring (mirrors GradingDetail) ──────────────────────────
function CircularProgress({ value, max, size = 104, strokeWidth = 9 }) {
  const radius        = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct           = max > 0 ? Math.min(value / max, 1) : 0;
  const offset        = circumference * (1 - pct);
  const color         = pct >= 0.75 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#e0e0e0" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function gradeLabel(pct) {
  if (pct === null) return 'Not Graded';
  if (pct >= 90)   return 'Excellent';
  if (pct >= 75)   return 'Good';
  if (pct >= 60)   return 'Satisfactory';
  return 'Needs Improvement';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Component ────────────────────────────────────────────────────────────────
function ResultDetail({ submission, onNavigate }) {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnswers = useCallback(async () => {
    if (!submission) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('answers')
      .select('id, answer_text, marks_awarded, questions ( id, text, marks, order_index )')
      .eq('submission_id', submission.id);

    if (error || !data) {
      setLoading(false);
      return;
    }

    setAnswers(
      [...data].sort((a, b) => (a.questions?.order_index ?? 0) - (b.questions?.order_index ?? 0))
    );
    setLoading(false);
  }, [submission]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!submission) {
    return (
      <div className="rd-page">
        <div className="rd-empty">
          No result selected.{' '}
          <button onClick={() => onNavigate('results')}>Return to results</button>
        </div>
      </div>
    );
  }

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totalMarks   = answers.reduce((sum, a) => sum + (a.questions?.marks ?? 0), 0);
  const awardedMarks = answers.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0);
  const pct          = submission.status === 'Graded' && totalMarks > 0
    ? Math.round((awardedMarks / totalMarks) * 100)
    : null;

  return (
    <div className="rd-page">

      {/* Topbar */}
      <div className="rd-topbar">
        <nav className="rd-breadcrumb">
          <button className="rd-crumb-link" onClick={() => onNavigate('results')}>
            My Results
          </button>
          <span className="rd-crumb-sep">/</span>
          <span className="rd-crumb-current">{submission.title}</span>
        </nav>
      </div>

      {/* Body */}
      <div className="rd-body">

        {/* Title row */}
        <div className="rd-title-row">
          <div>
            <h1 className="rd-title">{submission.title}</h1>
            <div className="rd-meta">
              {submission.topic ? `${submission.topic} · ` : ''}
              Submitted {formatDate(submission.submittedAt)}
            </div>
          </div>
          <span className={`rd-badge ${submission.status === 'Graded' ? 'rd-badge-graded' : 'rd-badge-pending'}`}>
            {submission.status}
          </span>
        </div>

        {/* Metric cards */}
        <div className="rd-metrics-row">
          <div className="rd-metric-card">
            <div className="rd-metric-label">Questions</div>
            <div className="rd-metric-value rd-metric-dark">
              {loading ? '—' : answers.length}
            </div>
            <div className="rd-metric-sub">in this submission</div>
          </div>

          <div className="rd-metric-card">
            <div className="rd-metric-label">Total Marks</div>
            <div className="rd-metric-value rd-metric-dark">
              {loading ? '—' : totalMarks}
            </div>
            <div className="rd-metric-sub">available</div>
          </div>

          <div className="rd-metric-card">
            <div className="rd-metric-label">Your Score</div>
            <div
              className="rd-metric-value"
              style={{
                color: pct !== null
                  ? (pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444')
                  : '#bbb',
              }}
            >
              {pct !== null ? awardedMarks : '—'}
            </div>
            <div className="rd-metric-sub">
              {pct !== null ? `${pct}% score` : 'pending review'}
            </div>
          </div>

          <div className="rd-metric-card">
            <div className="rd-metric-label">Grade</div>
            <div className={`rd-metric-value ${pct !== null && pct >= 60 ? 'rd-metric-pass' : pct !== null ? 'rd-metric-fail' : 'rd-metric-dark'}`}
              style={{ fontSize: pct !== null ? 18 : 28 }}
            >
              {gradeLabel(pct)}
            </div>
            <div className="rd-metric-sub">performance</div>
          </div>
        </div>

        {/* Main 2-column layout */}
        {loading ? (
          <div className="rd-loading">Loading your answers…</div>
        ) : (
          <div className="rd-main">

            {/* Left: per-question breakdown */}
            <div className="rd-content">
              {submission.status !== 'Graded' ? (
                <div className="rd-section-card rd-pending-card">
                  <p className="rd-pending-text">
                    Your submission is pending review. Your score and breakdown will appear here once your lecturer has graded it.
                  </p>
                </div>
              ) : answers.length === 0 ? (
                <div className="rd-section-card" style={{ textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  No answers found for this submission.
                </div>
              ) : (
                answers.map((a, idx) => {
                  const maxMarks  = a.questions?.marks ?? 0;
                  const awarded   = a.marks_awarded ?? 0;
                  const qPct      = maxMarks > 0 ? awarded / maxMarks : 0;
                  const scoreColor = qPct >= 0.75 ? '#10b981' : qPct >= 0.5 ? '#f59e0b' : '#ef4444';

                  return (
                    <div key={a.id} className="rd-section-card">

                      {/* Question header */}
                      <div className="rd-q-header">
                        <span className="rd-q-label">Question {idx + 1}</span>
                        <span className="rd-q-score" style={{ color: scoreColor }}>
                          {awarded} / {maxMarks} marks
                        </span>
                      </div>

                      {/* Question text */}
                      <p className="rd-q-text">{a.questions?.text ?? '—'}</p>

                      {/* Student answer */}
                      <div className="rd-answer-section-label">Your Answer</div>
                      <div className="rd-answer-box">
                        {a.answer_text
                          ? a.answer_text.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
                          : <p style={{ color: '#aaa' }}>No answer submitted.</p>
                        }
                      </div>

                      {/* Score bar */}
                      <div className="rd-score-bar-row">
                        <div className="rd-score-bar-track">
                          <div
                            className="rd-score-bar-fill"
                            style={{ width: `${qPct * 100}%`, background: scoreColor }}
                          />
                        </div>
                        <span className="rd-score-bar-pct" style={{ color: scoreColor }}>
                          {Math.round(qPct * 100)}%
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Right: sidebar */}
            <aside className="rd-sidebar">

              {/* Overall grade ring */}
              <div className="rd-side-card">
                <div className="rd-grade-header">Overall Grade</div>
                <div className="rd-score-circle-wrap">
                  <div className="rd-score-ring">
                    <CircularProgress
                      value={pct !== null ? awardedMarks : 0}
                      max={totalMarks > 0 ? totalMarks : 1}
                    />
                    <div className="rd-score-overlay">
                      {pct !== null ? (
                        <>
                          <span className="rd-score-num">{awardedMarks}</span>
                          <span className="rd-score-denom">/{totalMarks}</span>
                        </>
                      ) : (
                        <span className="rd-score-pending">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rd-grade-label">{gradeLabel(pct)}</div>
                {pct !== null && <div className="rd-grade-pct">{pct}% Score</div>}
              </div>

              {/* Submission info */}
              <div className="rd-side-card">
                {[
                  { label: 'Assessment', value: submission.title                       },
                  { label: 'Topic',      value: submission.topic || 'No topic'         },
                  { label: 'Status',     value: submission.status                      },
                  { label: 'Submitted',  value: formatDate(submission.submittedAt)     },
                  { label: 'Max Marks',  value: `${totalMarks} marks`                 },
                ].map(row => (
                  <div key={row.label} className="rd-info-row">
                    <span className="rd-info-label">{row.label}</span>
                    <span className="rd-info-value">{row.value}</span>
                  </div>
                ))}
              </div>

            </aside>
          </div>
        )}

      </div>
    </div>
  );
}

export default ResultDetail;
