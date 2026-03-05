import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './TakeTest.css';

function TakeTest({ assessment, onNavigate }) {
  const { user } = useUser();

  const [questions,        setQuestions]        = useState([]);
  const [answers,          setAnswers]          = useState([]);
  const [currentIdx,       setCurrentIdx]       = useState(0);
  const [loading,          setLoading]          = useState(true);
  const [submitting,       setSubmitting]       = useState(false);
  const [submitted,        setSubmitted]        = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error,            setError]            = useState('');

  useEffect(() => {
    if (!assessment) {
      onNavigate('student-assessments');
      return;
    }
    loadAssessment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAssessment = async () => {
    setLoading(true);

    // Check whether this student already submitted for this assessment
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('assessment_id', assessment.id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (existing) {
      setAlreadySubmitted(true);
      setLoading(false);
      return;
    }

    // Fetch questions ordered by their original position
    const { data, error: qErr } = await supabase
      .from('questions')
      .select('id, text, marks, answer_length')
      .eq('assessment_id', assessment.id)
      .order('order_index', { ascending: true });

    if (qErr || !data || data.length === 0) {
      setError('Failed to load questions. Please try again.');
      setLoading(false);
      return;
    }

    setQuestions(data);
    setAnswers(data.map(() => ''));
    setLoading(false);
  };

  const handleAnswerChange = (val) => {
    setAnswers(prev => prev.map((a, i) => i === currentIdx ? val : a));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create the submission row first to obtain its ID
      const { data: sub, error: subErr } = await supabase
        .from('submissions')
        .insert({ assessment_id: assessment.id, student_id: user.id })
        .select()
        .single();

      if (subErr) throw subErr;

      // Insert one answer row per question
      const { error: ansErr } = await supabase
        .from('answers')
        .insert(
          questions.map((q, i) => ({
            submission_id: sub.id,
            question_id:   q.id,
            answer_text:   answers[i] || '',
          }))
        );

      if (ansErr) throw ansErr;

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="tt-page">
        <div className="tt-center-message">Loading assessment…</div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="tt-page">
        <div className="tt-center-message tt-center-message-error">{error}</div>
      </div>
    );
  }

  // ── Already submitted ─────────────────────────────────────────────────────
  if (alreadySubmitted) {
    return (
      <div className="tt-page">
        <div className="tt-done-card">
          <div className="tt-done-icon">✓</div>
          <div className="tt-done-title">Already Submitted</div>
          <div className="tt-done-sub">
            You have already submitted this assessment. Results will be available once graded.
          </div>
          <button className="tt-btn-primary" onClick={() => onNavigate('student-assessments')}>
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="tt-page">
        <div className="tt-done-card">
          <div className="tt-done-icon tt-done-icon-success">✓</div>
          <div className="tt-done-title">Submitted!</div>
          <div className="tt-done-sub">
            Your answers have been recorded. Results will be available once your lecturer has graded them.
          </div>
          <button className="tt-btn-primary" onClick={() => onNavigate('student-assessments')}>
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  // ── Question stepper ──────────────────────────────────────────────────────
  const q        = questions[currentIdx];
  const isLast   = currentIdx === questions.length - 1;
  const progress = ((currentIdx + 1) / questions.length) * 100;

  // Textarea height hint based on expected answer length
  const rows = q.answer_length === 'short' ? 4 : q.answer_length === 'long' ? 14 : 8;

  return (
    <div className="tt-page">

      {/* Header */}
      <div className="tt-header">
        <div className="tt-header-left">
          <button className="tt-back-btn" onClick={() => onNavigate('student-assessments')}>
            ← Back
          </button>
          <div>
            <div className="tt-header-title">{assessment.title}</div>
            {assessment.topic && <div className="tt-header-sub">{assessment.topic}</div>}
          </div>
        </div>
        <div className="tt-header-counter">
          Question {currentIdx + 1} of {questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="tt-progress-track">
        <div className="tt-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question card */}
      <div className="tt-body">
        <div className="tt-q-card">
          <div className="tt-q-meta">
            <span className="tt-q-num">Q{currentIdx + 1}</span>
            <span className="tt-q-marks">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
          </div>
          <div className="tt-q-text">{q.text}</div>
          <textarea
            className="tt-answer-input"
            rows={rows}
            placeholder="Type your answer here…"
            value={answers[currentIdx]}
            onChange={(e) => handleAnswerChange(e.target.value)}
          />
        </div>

        {/* Navigation */}
        <div className="tt-nav">
          <button
            className="tt-btn-ghost"
            onClick={() => setCurrentIdx(i => i - 1)}
            disabled={currentIdx === 0}
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              className="tt-btn-submit"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              className="tt-btn-primary"
              onClick={() => setCurrentIdx(i => i + 1)}
            >
              Next →
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

export default TakeTest;
