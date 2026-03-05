import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './StudentAssessments.css';

// ── Mock data — Completed tab (replaced once submissions table exists) ──────
const COMPLETED_MOCK = [
  { id: 'A003', title: 'CS-201 Final',  topic: 'Algorithms',      questions: 8, maxMarks: 150, score: 123, status: 'Graded',         submittedOn: 'Feb 14, 2026' },
  { id: 'A002', title: 'CS-301 Quiz 2', topic: 'Data Structures', questions: 3, maxMarks: 30,  score: 22,  status: 'Graded',         submittedOn: 'Feb 10, 2026' },
  { id: 'A004', title: 'CS-401 Quiz 1', topic: 'Automata Theory', questions: 4, maxMarks: 40,  score: 36,  status: 'Graded',         submittedOn: 'Jan 28, 2026' },
  { id: 'A006', title: 'CS-301 Quiz 1', topic: 'Data Structures', questions: 3, maxMarks: 30,  score: null, status: 'Pending Review', submittedOn: 'Feb 20, 2026' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreClass(pct) {
  if (pct >= 85) return 'stu-score-high';
  if (pct >= 65) return 'stu-score-mid';
  return 'stu-score-low';
}

// ── Component ──────────────────────────────────────────────────────────────
function StudentAssessments({ onNavigate }) {
  const { user } = useUser();

  const [activeTab,  setActiveTab]  = useState('Available');
  const [available,  setAvailable]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [codeInput,  setCodeInput]  = useState('');
  const [codeError,  setCodeError]  = useState('');
  const [joining,    setJoining]    = useState(false);
  const [toast,      setToast]      = useState('');

  // ── Fetch enrolled active assessments ─────────────────────────────────────
  const fetchEnrolled = useCallback(async () => {
    setLoading(true);

    // Step 1: get the IDs of assessments this student is enrolled in
    const { data: enrollments, error: eErr } = await supabase
      .from('student_assessments')
      .select('assessment_id')
      .eq('student_id', user.id);

    if (eErr || !enrollments || enrollments.length === 0) {
      setAvailable([]);
      setLoading(false);
      return;
    }

    // Step 2: fetch only Active assessments from that enrolled set
    const ids = enrollments.map(e => e.assessment_id);

    const { data, error } = await supabase
      .from('assessments')
      .select('id, title, topic, questions ( id, marks )')
      .in('id', ids)
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    if (error) {
      setAvailable([]);
      setLoading(false);
      return;
    }

    setAvailable(data.map(a => ({
      id:        a.id,
      title:     a.title,
      topic:     a.topic,
      questions: a.questions.length,
      maxMarks:  a.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
    })));
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchEnrolled(); }, [fetchEnrolled]);

  // ── Join by code ──────────────────────────────────────────────────────────
  const handleJoin = async (e) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    setJoining(true);
    setCodeError('');

    // Look up the assessment by access code
    const { data: assessment, error: aErr } = await supabase
      .from('assessments')
      .select('id, title, status')
      .eq('access_code', code)
      .eq('status', 'Active')
      .single();

    if (aErr || !assessment) {
      setCodeError('Invalid or expired code. Check the code and try again.');
      setJoining(false);
      return;
    }

    // Enroll the student — the UNIQUE constraint handles duplicate joins gracefully
    const { error: enrollErr } = await supabase
      .from('student_assessments')
      .insert({ student_id: user.id, assessment_id: assessment.id });

    if (enrollErr) {
      if (enrollErr.code === '23505') {
        setCodeError('You are already enrolled in this assessment.');
      } else {
        setCodeError('Something went wrong. Please try again.');
      }
      setJoining(false);
      return;
    }

    setCodeInput('');
    showToast(`Joined "${assessment.title}" successfully!`);
    fetchEnrolled();
    setJoining(false);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="stu-assess-page">

      {/* Topbar */}
      <div className="stu-assess-topbar">
        <div className="stu-assess-topbar-left">
          <div className="stu-assess-topbar-title">Assessments</div>
          <div className="stu-assess-topbar-sub">
            {loading ? 'Loading…' : `${available.length} available · ${COMPLETED_MOCK.length} completed`}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="stu-assess-tabs">
        {['Available', 'Completed'].map((tab) => (
          <button
            key={tab}
            className={`stu-assess-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span className="stu-assess-tab-count">
              {tab === 'Available' ? available.length : COMPLETED_MOCK.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Available tab ── */}
      {activeTab === 'Available' && (
        <div className="stu-assess-list">

          {/* Code entry */}
          <div className="stu-code-box">
            <div className="stu-code-box-title">Join an Assessment</div>
            <div className="stu-code-box-sub">Enter the code shared by your lecturer to access an assessment.</div>
            <form className="stu-code-form" onSubmit={handleJoin}>
              <input
                className={`stu-code-input ${codeError ? 'error' : ''}`}
                type="text"
                placeholder="e.g. ABCD-1234"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); }}
                maxLength={9}
                spellCheck={false}
              />
              <button className="stu-btn-primary" type="submit" disabled={joining || !codeInput.trim()}>
                {joining ? 'Joining…' : 'Join'}
              </button>
            </form>
            {codeError && <div className="stu-code-error">{codeError}</div>}
          </div>

          {/* Enrolled assessments list */}
          {loading ? (
            <div className="stu-assess-empty">Loading your assessments…</div>
          ) : available.length === 0 ? (
            <div className="stu-assess-empty">
              No active assessments yet. Enter a code above to join one.
            </div>
          ) : (
            available.map((a) => (
              <div key={a.id} className="stu-assess-card">
                <div className="stu-assess-card-left">
                  <div className="stu-assess-card-title">{a.title}</div>
                  <div className="stu-assess-card-meta">
                    {a.topic || 'No topic'} · {a.questions} question{a.questions !== 1 ? 's' : ''} · {a.maxMarks} marks
                  </div>
                </div>
                <div className="stu-assess-card-right">
                  <span className="stu-badge stu-badge-active">Active</span>
                  <button
                    className="stu-btn-primary"
                    onClick={() => onNavigate('take-test', { id: a.id, title: a.title, topic: a.topic })}
                  >
                    Start →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Completed tab ── */}
      {activeTab === 'Completed' && (
        <div className="stu-assess-list">
          {COMPLETED_MOCK.length === 0 ? (
            <div className="stu-assess-empty">You haven't completed any assessments yet.</div>
          ) : (
            COMPLETED_MOCK.map((a) => {
              const pct = a.score !== null ? Math.round((a.score / a.maxMarks) * 100) : null;
              return (
                <div key={a.id} className="stu-assess-card">
                  <div className="stu-assess-card-left">
                    <div className="stu-assess-card-title">{a.title}</div>
                    <div className="stu-assess-card-meta">
                      {a.topic} · {a.questions} question{a.questions !== 1 ? 's' : ''} · {a.maxMarks} marks
                    </div>
                    <div className="stu-assess-card-due">Submitted: {a.submittedOn}</div>
                  </div>
                  <div className="stu-assess-card-right">
                    {pct !== null ? (
                      <div className={`stu-assess-score ${scoreClass(pct)}`}>{pct}%</div>
                    ) : (
                      <span className="stu-badge stu-badge-pending">{a.status}</span>
                    )}
                    {a.status === 'Graded' && (
                      <button className="stu-btn-ghost" onClick={() => onNavigate('results')}>
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Toast */}
      {toast && <div className="stu-assess-toast">{toast}</div>}
    </div>
  );
}

export default StudentAssessments;
