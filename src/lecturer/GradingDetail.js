import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import './GradingDetail.css';

// ── Circular progress ring ─────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────
function gradeLabel(pct) {
  if (pct === null) return 'Not Graded';
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Good';
  if (pct >= 60) return 'Satisfactory';
  return 'Needs Improvement';
}

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

// ── Component ──────────────────────────────────────────────────────────────
function GradingDetail({ submission, onNavigate }) {
  const [answers,      setAnswers]      = useState([]);
  const [overrides,    setOverrides]    = useState({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [toast,        setToast]        = useState('');
  const [status,       setStatus]       = useState(submission?.status ?? '');
  const [aiScoring,    setAiScoring]    = useState(false);  // edge function in-flight
  const [gradingMode,  setGradingMode]  = useState(null);  // 'auto' | 'manual' | null

  // ── Fetch answers (with question details) for this submission ─────────────
  const fetchAnswers = useCallback(async () => {
    if (!submission) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('answers')
      .select(`
        id,
        answer_text,
        ai_score,
        marks_awarded,
        questions ( id, text, marks, sample_answer, order_index )
      `)
      .eq('submission_id', submission.id);

    if (error || !data) {
      setLoading(false);
      return;
    }

    const sorted = [...data].sort(
      (a, b) => (a.questions?.order_index ?? 0) - (b.questions?.order_index ?? 0)
    );

    setAnswers(sorted);

    // Pre-fill overrides with any existing marks_awarded values
    const init = {};
    sorted.forEach(a => {
      init[a.id] = a.marks_awarded !== null ? String(a.marks_awarded) : '';
    });
    setOverrides(init);
    setLoading(false);
  }, [submission]);

  useEffect(() => {
    fetchAnswers();
    setStatus(submission?.status ?? '');
    // Reset AI / grading state when submission changes
    setOverrideMode(false);
    setGradingMode(null);
  }, [fetchAnswers, submission]);

  // ── Run AI grading via Supabase Edge Function ──────────────────────────────
  const handleRunAI = async () => {
    setAiScoring(true);
    try {
      const { error } = await supabase.functions.invoke('grade-submission', {
        body: { submission_id: submission.id },
      });
      if (error) throw error;
      await fetchAnswers(); // pull fresh ai_score values into state
      showToast('AI grading complete.');
    } catch (err) {
      showToast('AI grading failed. Please try again.');
      console.error(err);
    } finally {
      setAiScoring(false);
    }
  };

  // ── Enter grading mode ────────────────────────────────────────────────────
  // 'auto'  → pre-fill inputs with Math.round(ai_score × max_marks)
  // 'manual' → keep existing overrides (marks_awarded or blank)
  const handleChooseMode = (mode) => {
    setGradingMode(mode);
    setOverrideMode(true);
    if (mode === 'auto') {
      const init = {};
      answers.forEach(a => {
        const suggested = a.ai_score !== null
          ? Math.round(a.ai_score * (a.questions?.marks ?? 0))
          : (a.marks_awarded !== null ? a.marks_awarded : 0);
        init[a.id] = String(suggested);
      });
      setOverrides(init);
    }
  };

  // ── Save grades to DB ─────────────────────────────────────────────────────
  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      for (const answer of answers) {
        const val = parseInt(overrides[answer.id], 10);
        if (!isNaN(val)) {
          const { error } = await supabase
            .from('answers')
            .update({ marks_awarded: val })
            .eq('id', answer.id);
          if (error) throw error;
        }
      }

      const { error: sErr } = await supabase
        .from('submissions')
        .update({ status: 'Graded' })
        .eq('id', submission.id);
      if (sErr) throw sErr;

      setStatus('Graded');
      setOverrideMode(false);
      setGradingMode(null);
      showToast('Grades saved successfully.');
      await fetchAnswers();
    } catch (err) {
      showToast('Failed to save grades. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!submission) {
    return (
      <div className="gd-page">
        <div className="gd-empty">
          No submission selected.{' '}
          <button onClick={() => onNavigate('grading')}>Return to queue</button>
        </div>
      </div>
    );
  }

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalMarks   = answers.reduce((sum, a) => sum + (a.questions?.marks ?? 0), 0);
  const awardedMarks = answers.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0);
  const pct          = status === 'Graded' && totalMarks > 0
    ? Math.round((awardedMarks / totalMarks) * 100)
    : null;
  const hasAiScores  = answers.some(a => a.ai_score !== null);

  return (
    <div className="gd-page">

      {/* Topbar */}
      <div className="gd-topbar">
        <nav className="gd-breadcrumb">
          <button className="gd-crumb-link" onClick={() => onNavigate('grading')}>
            Grading Queue
          </button>
          <span className="gd-crumb-sep">/</span>
          <span className="gd-crumb-link">{submission.assessmentTitle}</span>
          <span className="gd-crumb-sep">/</span>
          <span className="gd-crumb-current">{submission.studentName}</span>
        </nav>
        <div className="gd-topbar-actions">
          {!overrideMode && status === 'Graded' && (
            <button
              className="gd-btn-ghost"
              onClick={() => { setGradingMode('manual'); setOverrideMode(true); }}
            >
              Edit Grades
            </button>
          )}
        </div>
      </div>

      {/* Page body */}
      <div className="gd-body">

        {/* Title row */}
        <div className="gd-title-row">
          <div>
            <h1 className="gd-title">{submission.assessmentTitle}</h1>
            <div className="gd-meta">
              {submission.studentName}&nbsp;&bull;&nbsp;Submitted {submission.date}
            </div>
          </div>
          <span className={`gd-badge-complete ${status !== 'Graded' ? 'gd-badge-pending' : ''}`}>
            {status === 'Graded' ? 'Graded' : 'Pending Review'}
          </span>
        </div>

        {/* Metric cards */}
        <div className="gd-metrics-row">
          <div className="gd-metric-card">
            <div className="gd-metric-label">Questions</div>
            <div className="gd-metric-value gd-metric-dark">
              {loading ? '—' : answers.length}
            </div>
            <div className="gd-metric-sub">in this submission</div>
          </div>

          <div className="gd-metric-card">
            <div className="gd-metric-label">Total Marks</div>
            <div className="gd-metric-value gd-metric-dark">
              {loading ? '—' : totalMarks}
            </div>
            <div className="gd-metric-sub">available</div>
          </div>

          <div className="gd-metric-card">
            <div className="gd-metric-label">Marks Awarded</div>
            <div
              className="gd-metric-value"
              style={{
                color: pct !== null
                  ? (pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444')
                  : '#999',
              }}
            >
              {status === 'Graded' ? awardedMarks : '—'}
            </div>
            <div className="gd-metric-sub">
              {pct !== null ? `${pct}% score` : 'not yet graded'}
            </div>
          </div>

          <div className="gd-metric-card">
            <div className="gd-metric-label">Status</div>
            <div className={`gd-metric-value ${status === 'Graded' ? 'gd-metric-pass' : 'gd-metric-dark'}`}>
              {status === 'Graded' ? 'Graded' : 'Pending'}
            </div>
            <div className="gd-metric-sub">submission status</div>
          </div>
        </div>

        {/* Main 2-column layout */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: 14 }}>
            Loading answers…
          </div>
        ) : (
          <div className="gd-main">

            {/* Left: one card per question */}
            <div className="gd-content">
              {answers.length === 0 ? (
                <div className="gd-section-card" style={{ textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  No answers found for this submission.
                </div>
              ) : (
                answers.map((a, idx) => (
                  <div key={a.id}>

                    {/* Question prompt */}
                    <div className="gd-section-card">
                      <div className="gd-section-header">
                        <span className="gd-section-label">Question {idx + 1}</span>
                        <span className="gd-max-pts">Max: {a.questions?.marks ?? 0} marks</span>
                      </div>
                      <p className="gd-prompt-text">{a.questions?.text ?? '—'}</p>

                      {a.questions?.sample_answer && (
                        <div className="gd-sample-answer-box">
                          <div className="gd-sample-answer-label">Reference Answer</div>
                          <p className="gd-sample-answer-text">{a.questions.sample_answer}</p>
                        </div>
                      )}
                    </div>

                    {/* Student answer */}
                    <div className="gd-section-card">
                      <div className="gd-section-header">
                        <span className="gd-section-label">Student Answer</span>
                        <div className="gd-section-header-right">
                          {a.ai_score !== null && (
                            <span className="gd-ai-similarity-badge">
                              AI similarity: {Math.round(a.ai_score * 100)}%
                            </span>
                          )}
                          <span className="gd-word-count">
                            {wordCount(a.answer_text)} words
                          </span>
                        </div>
                      </div>
                      <div className="gd-answer-box">
                        {a.answer_text
                          ? a.answer_text.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
                          : <p style={{ color: '#aaa' }}>No answer submitted.</p>
                        }
                      </div>
                      {a.marks_awarded !== null && (
                        <div className="gd-awarded-badge">
                          Awarded: {a.marks_awarded} / {a.questions?.marks ?? 0} marks
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Right: grade sidebar */}
            <aside className="gd-sidebar">

              {/* Overall grade */}
              <div className="gd-side-card">
                <div className="gd-grade-header">Overall Grade</div>
                <div className="gd-score-circle-wrap">
                  <div className="gd-score-ring">
                    <CircularProgress
                      value={status === 'Graded' ? awardedMarks : 0}
                      max={totalMarks > 0 ? totalMarks : 1}
                    />
                    <div className="gd-score-overlay">
                      {status === 'Graded' ? (
                        <>
                          <span className="gd-score-num">{awardedMarks}</span>
                          <span className="gd-score-denom">/{totalMarks}</span>
                        </>
                      ) : (
                        <span className="gd-score-pending">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="gd-grade-label">{gradeLabel(pct)}</div>
                {pct !== null && <div className="gd-grade-pct">{pct}% Score</div>}
              </div>

              {/* Submission info */}
              <div className="gd-side-card">
                {[
                  { label: 'Student',    value: submission.studentName    },
                  { label: 'Assessment', value: submission.assessmentTitle },
                  { label: 'Status',     value: status                    },
                  { label: 'Submitted',  value: submission.date           },
                ].map(row => (
                  <div key={row.label} className="gd-info-row">
                    <span className="gd-info-label">{row.label}</span>
                    <span className="gd-info-value">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Grading panel */}
              <div className="gd-side-card">
                <h3 className="gd-override-title">Grading</h3>

                {!overrideMode ? (
                  <>
                    {/* Already graded */}
                    {status === 'Graded' && (
                      <p className="gd-override-desc">
                        Grades have been saved. Click "Edit Grades" in the toolbar to make changes.
                      </p>
                    )}

                    {/* AI scoring in progress */}
                    {status !== 'Graded' && aiScoring && (
                      <div className="gd-ai-loading">
                        <div className="gd-ai-spinner" />
                        <p className="gd-override-desc">Running AI grading…</p>
                      </div>
                    )}

                    {/* AI scores ready — choose mode */}
                    {status !== 'Graded' && !aiScoring && hasAiScores && (
                      <>
                        <p className="gd-override-desc">
                          AI scores are ready. Choose how to finalise marks.
                        </p>
                        <button
                          className="gd-btn-mode gd-btn-mode-auto"
                          onClick={() => handleChooseMode('auto')}
                        >
                          <span className="gd-btn-mode-title">Auto Grade</span>
                          <span className="gd-btn-mode-sub">Pre-fill marks from AI scores</span>
                        </button>
                        <button
                          className="gd-btn-mode gd-btn-mode-manual"
                          onClick={() => handleChooseMode('manual')}
                        >
                          <span className="gd-btn-mode-title">Grade Manually</span>
                          <span className="gd-btn-mode-sub">Enter marks yourself</span>
                        </button>
                        <button
                          className="gd-btn-ai-rerun"
                          onClick={handleRunAI}
                          disabled={aiScoring}
                        >
                          Re-run AI Grading
                        </button>
                      </>
                    )}

                    {/* No AI scores yet */}
                    {status !== 'Graded' && !aiScoring && !hasAiScores && (
                      <>
                        <p className="gd-override-desc">
                          Use AI to suggest marks based on semantic similarity to the reference answer, or grade manually.
                        </p>
                        <button
                          className="gd-btn-ai"
                          onClick={handleRunAI}
                          disabled={aiScoring}
                        >
                          Run AI Grading
                        </button>
                        <button
                          className="gd-btn-override"
                          onClick={() => handleChooseMode('manual')}
                        >
                          Grade Manually
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  /* ── Override inputs ── */
                  <>
                    <p className="gd-override-desc">
                      {gradingMode === 'auto'
                        ? 'AI-suggested marks pre-filled. Adjust if needed.'
                        : 'Enter marks for each question below.'}
                    </p>
                    {answers.map((a, idx) => (
                      <div key={a.id} className="gd-override-row">
                        <div className="gd-override-field-label">
                          <span>Q{idx + 1}</span>
                          {a.ai_score !== null && (
                            <span className="gd-ai-hint">
                              AI: {Math.round(a.ai_score * (a.questions?.marks ?? 0))}/{a.questions?.marks ?? 0}
                            </span>
                          )}
                        </div>
                        <input
                          className="gd-override-input"
                          type="number"
                          min="0"
                          max={a.questions?.marks ?? 0}
                          value={overrides[a.id] ?? ''}
                          onChange={(e) =>
                            setOverrides(prev => ({ ...prev, [a.id]: e.target.value }))
                          }
                        />
                        <span className="gd-override-max">/ {a.questions?.marks ?? 0}</span>
                      </div>
                    ))}
                    <div className="gd-override-actions">
                      <button
                        className="gd-btn-ghost-sm"
                        onClick={() => { setOverrideMode(false); setGradingMode(null); }}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        className="gd-btn-primary-sm"
                        onClick={handleSaveGrades}
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save Grades'}
                      </button>
                    </div>
                  </>
                )}
              </div>

            </aside>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="gd-toast">{toast}</div>}

    </div>
  );
}

export default GradingDetail;
