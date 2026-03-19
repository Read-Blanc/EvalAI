import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './TakeTest.css';

function formatTime(s) {
  if (s <= 0) return '00:00';
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function TakeTest({ assessment, onNavigate }) {
  const { user } = useUser();

  const [questions,        setQuestions]        = useState([]);
  const [answers,          setAnswers]          = useState({});
  const [currentIdx,       setCurrentIdx]       = useState(0);
  const [loading,          setLoading]          = useState(true);
  const [submitting,       setSubmitting]       = useState(false);
  const [submitted,        setSubmitted]        = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error,            setError]            = useState('');
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [timeLeft,         setTimeLeft]         = useState(null);
  const [totalTime,        setTotalTime]        = useState(null);
  const [timedOut,         setTimedOut]         = useState(false);
  const timerRef      = useRef(null);
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    if (!assessment) { onNavigate('student-assessments'); return; }
    loadAssessment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAssessment = async () => {
    setLoading(true);

    // Check for existing submission
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('assessment_id', assessment.id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (existing) { setAlreadySubmitted(true); setLoading(false); return; }

    // Load questions
    const { data, error: qErr } = await supabase
      .from('questions')
      .select('id, text, marks, answer_length, order_index')
      .eq('assessment_id', assessment.id)
      .order('order_index', { ascending: true });

    if (qErr || !data || data.length === 0) {
      setError('Failed to load questions. Please try again.');
      setLoading(false);
      return;
    }

    setQuestions(data);
    const init = {};
    data.forEach(q => { init[q.id] = ''; });
    setAnswers(init);

    // Set up timer if assessment has a duration
    const duration = assessment.duration_minutes;
    if (duration) {
      const secs = duration * 60;
      setTotalTime(secs);
      const key = `evalai_timer_${assessment.id}_${user.id}`;
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const elapsed = Math.floor((Date.now() - JSON.parse(saved).startTime) / 1000);
        const rem = Math.max(0, secs - elapsed);
        setTimeLeft(rem);
        if (rem === 0) setTimedOut(true);
      } else {
        sessionStorage.setItem(key, JSON.stringify({ startTime: Date.now() }));
        setTimeLeft(secs);
      }
    }

    setLoading(false);
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || submitted || alreadySubmitted) return;
    if (timeLeft <= 0) {
      if (!autoSubmitRef.current) {
        autoSubmitRef.current = true;
        setTimedOut(true);
        handleSubmit(true);
      }
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, submitted, alreadySubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const { data: sub, error: subErr } = await supabase
        .from('submissions')
        .insert({ assessment_id: assessment.id, student_id: user.id, status: 'Pending' })
        .select()
        .single();
      if (subErr) throw subErr;

      const { error: ansErr } = await supabase
        .from('answers')
        .insert(questions.map(q => ({
          submission_id: sub.id,
          question_id:   q.id,
          answer_text:   answers[q.id] ?? '',
        })));
      if (ansErr) throw ansErr;

      sessionStorage.removeItem(`evalai_timer_${assessment.id}_${user.id}`);
      setSubmitted(true);
      if (isAuto) setTimedOut(false);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, assessment, user.id, questions, answers]);

  const answeredCount   = questions.filter(q => answers[q.id]?.trim()).length;
  const unansweredCount = questions.length - answeredCount;
  const urgent          = timeLeft !== null && totalTime !== null && timeLeft / totalTime <= 0.2;

  // ── States ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="tt-page">
      <div className="tt-center-message">
        <div className="tt-spinner" />
        <span>Loading assessment…</span>
      </div>
    </div>
  );

  if (error && !submitting) return (
    <div className="tt-page">
      <div className="tt-center-message tt-center-message-error">{error}</div>
    </div>
  );

  if (alreadySubmitted) return (
    <div className="tt-page">
      <div className="tt-done-card">
        <div className="tt-done-icon">⚠</div>
        <div className="tt-done-title">Already Submitted</div>
        <div className="tt-done-sub">
          You have already submitted this assessment. Results will appear once graded.
        </div>
        <button className="tt-btn-primary" onClick={() => onNavigate('results')}>
          View Results
        </button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="tt-page">
      <div className="tt-done-card">
        <div className="tt-done-icon tt-done-icon-success">✓</div>
        <div className="tt-done-title">Submitted!</div>
        <div className="tt-done-sub">
          Your answers have been recorded.
          <br />
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {answeredCount} of {questions.length} questions answered
          </span>
        </div>
        <button className="tt-btn-primary" onClick={() => onNavigate('student-assessments')}>
          Back to Assessments
        </button>
      </div>
    </div>
  );

  const q      = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const rows   = q?.answer_length === 'short' ? 4 : q?.answer_length === 'long' ? 14 : 8;

  return (
    <div className="tt-page">
      {/* Header */}
      <div className="tt-header">
        <div className="tt-header-left">
          <button className="tt-back-btn" onClick={() => onNavigate('student-assessments')}>← Back</button>
          <div>
            <div className="tt-header-title">{assessment.title}</div>
            {assessment.topic && <div className="tt-header-sub">{assessment.topic}</div>}
          </div>
        </div>
        <div className="tt-header-right">
          <div className="tt-header-counter">
            Q{currentIdx + 1}/{questions.length} · {answeredCount} answered
          </div>
          {/* Timer */}
          {timeLeft !== null && (
            <div className={`tt-timer ${urgent ? 'tt-timer-urgent' : ''}`}>
              <span>⏱</span>
              <span className="tt-timer-value">{formatTime(timeLeft)}</span>
            </div>
          )}
          <button className="tt-btn-submit-top" onClick={() => setShowConfirm(true)} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Timed out banner */}
      {timedOut && !submitted && (
        <div className="tt-timeout-banner">
          Time's up — auto-submitting your answers…
        </div>
      )}

      {/* Progress bar */}
      <div className="tt-progress-track">
        <div className="tt-progress-fill"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Body */}
      <div className="tt-body">
        {/* Question nav dots */}
        <div className="tt-nav-dots">
          {questions.map((qs, i) => {
            const answered = answers[qs.id]?.trim();
            return (
              <button key={qs.id} onClick={() => setCurrentIdx(i)}
                className={`tt-dot ${i === currentIdx ? 'tt-dot-active' : answered ? 'tt-dot-answered' : ''}`}
                title={`Question ${i + 1}`}>
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div className="tt-q-card">
          <div className="tt-q-meta">
            <span className="tt-q-num">Q{currentIdx + 1}</span>
            <span className="tt-q-marks">{q?.marks} mark{q?.marks !== 1 ? 's' : ''}</span>
          </div>
          <div className="tt-q-text">{q?.text}</div>
          <textarea
            className="tt-answer-input"
            rows={rows}
            placeholder="Type your answer here…"
            value={answers[q?.id] ?? ''}
            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
          />
          <div className="tt-word-count">
            {answers[q?.id]?.trim().split(/\s+/).filter(Boolean).length || 0} words
            {answers[q?.id]?.trim() && <span className="tt-answered-check"> · ✓ Answered</span>}
          </div>
        </div>

        {/* Navigation */}
        <div className="tt-nav">
          <button className="tt-btn-ghost"
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}>
            ← Previous
          </button>
          {isLast ? (
            <button className="tt-btn-submit" onClick={() => setShowConfirm(true)}>
              Review &amp; Submit
            </button>
          ) : (
            <button className="tt-btn-primary"
              onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}>
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="tt-modal-overlay">
          <div className="tt-modal">
            <h3 className="tt-modal-title">Submit Assessment?</h3>
            {unansweredCount > 0 ? (
              <div className="tt-modal-warn">
                <p>You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount !== 1 ? 's' : ''}.</p>
                <p className="tt-modal-note">You cannot change your answers after submission.</p>
              </div>
            ) : (
              <p className="tt-modal-text">
                All {questions.length} questions answered. You cannot change your answers after submission.
              </p>
            )}
            <div className="tt-modal-actions">
              <button className="tt-btn-ghost" onClick={() => setShowConfirm(false)}>Go Back</button>
              <button className="tt-btn-submit" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TakeTest;