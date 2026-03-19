/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './StudentAssessments.css';

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreClass(pct) {
  if (pct >= 85) return 'stu-score-high';
  if (pct >= 65) return 'stu-score-mid';
  return 'stu-score-low';
}

function closesLabel(closeAt, now) {
  if (!closeAt) return null;
  const d = new Date(closeAt);
  const diffMs = d - now;
  if (diffMs <= 0) return 'Closing now';
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffM = Math.floor((diffMs % 3_600_000) / 60_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffH < 1)  return `Closes in ${diffM}m`;
  if (diffH < 24) return `Closes in ${diffH}h${diffM > 0 ? ` ${diffM}m` : ''}`;
  if (diffD < 7)  return `Closes in ${diffD}d`;
  return `Closes ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

function opensLabel(openAt) {
  if (!openAt) return 'Scheduled';
  const d = new Date(openAt);
  const diffMs = d - new Date();
  const diffH  = Math.floor(diffMs / 3600000);
  const diffD  = Math.floor(diffMs / 86400000);
  if (diffMs < 0)  return 'Opening soon';
  if (diffH < 1)   return 'Opens in < 1h';
  if (diffH < 24)  return `Opens in ${diffH}h`;
  if (diffD < 7)   return `Opens in ${diffD}d`;
  return `Opens ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

// ── Component ──────────────────────────────────────────────────────────────
function StudentAssessments({ onNavigate }) {
  const { user } = useUser();

  const [available,  setAvailable]  = useState([]);
  const [scheduled,  setScheduled]  = useState([]);
  const [completed,  setCompleted]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('Available');
  const [codeInput,  setCodeInput]  = useState('');
  const [codeError,  setCodeError]  = useState('');
  const [codeOk,     setCodeOk]     = useState('');
  const [joining,    setJoining]    = useState(false);
  const [toast,      setToast]      = useState('');
  const [now,        setNow]        = useState(() => new Date());

  // Tick every 30s so countdown labels refresh
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);

    const [{ data: enrolled }, { data: subs }] = await Promise.all([
      supabase
        .from('assessment_students')
        .select('assessments(id, title, topic, status, duration_minutes, open_at, close_at, questions(id, marks))')
        .eq('student_id', user.id),
      supabase
        .from('submissions')
        .select('assessment_id, status, answers(marks_awarded), assessments(questions(marks))')
        .eq('student_id', user.id),
    ]);

    const submittedMap = {};
    (subs ?? []).forEach(s => {
      const maxM  = s.assessments?.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) ?? 0;
      const award = s.answers?.reduce((sum, a) => sum + (a.marks_awarded || 0), 0) ?? 0;
      submittedMap[s.assessment_id] = {
        submitted: true,
        status: s.status,
        pct: maxM > 0 ? Math.round((award / maxM) * 100) : null,
        award,
        maxM,
      };
    });

    const all = (enrolled ?? [])
      .map(row => row.assessments)
      .filter(Boolean)
      .map(a => ({
        id:        a.id,
        title:     a.title,
        topic:     a.topic,
        status:    a.status,
        questions: a.questions?.length ?? 0,
        maxMarks:  a.questions?.reduce((s, q) => s + (q.marks ?? 0), 0) ?? 0,
        duration:  a.duration_minutes,
        openAt:    a.open_at,
        closeAt:   a.close_at,
        ...submittedMap[a.id],
      }));

    setAvailable(all.filter(a => a.status === 'Active'   && !a.submitted));
    setScheduled(all.filter(a => a.status === 'Scheduled'));
    setCompleted(all.filter(a => a.submitted || a.status === 'Closed'));
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  // ── Join by code ──────────────────────────────────────────────────────────
  const handleJoin = async (e) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setCodeError('');
    setCodeOk('');

    const { data: asm, error } = await supabase
      .from('assessments')
      .select('id, title, status')
      .eq('access_code', code)
      .single();

    if (error || !asm) {
      setCodeError('Invalid code. Please check and try again.');
      setJoining(false);
      return;
    }
    if (asm.status !== 'Active' && asm.status !== 'Scheduled') {
      setCodeError('This assessment is not currently accepting students.');
      setJoining(false);
      return;
    }

    const { error: joinErr } = await supabase
      .from('assessment_students')
      .upsert({ student_id: user.id, assessment_id: asm.id }, { onConflict: 'student_id,assessment_id' });

    setJoining(false);
    if (joinErr) {
      setCodeError('Could not join. You may already be enrolled.');
      return;
    }

    setCodeInput('');
    setCodeOk(`Joined "${asm.title}" successfully!`);
    setTimeout(() => setCodeOk(''), 4000);
    fetchAssessments();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const shown =
    activeTab === 'Available' ? available :
    activeTab === 'Upcoming'  ? scheduled :
    completed;

  const tabs = [
    { key: 'Available', count: available.length },
    { key: 'Upcoming',  count: scheduled.length },
    { key: 'Completed', count: completed.length },
  ];

  return (
    <div className="stu-assess-page">

      {/* Topbar */}
      <div className="stu-assess-topbar">
        <div>
          <div className="stu-assess-topbar-title">Assessments</div>
          <div className="stu-assess-topbar-sub">
            {loading
              ? 'Loading…'
              : `${available.length} available · ${scheduled.length} upcoming · ${completed.length} completed`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="stu-assess-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`stu-assess-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.key}
            <span className="stu-assess-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="stu-assess-list">

        {/* Code entry — only on Available tab */}
        {activeTab === 'Available' && (
          <div className="stu-code-box">
            <div className="stu-code-box-title">Join with Access Code</div>
            <div className="stu-code-box-sub">
              Enter the code your lecturer shared to enrol in an assessment.
            </div>
            <form className="stu-code-form" onSubmit={handleJoin}>
              <input
                className={`stu-code-input ${codeError ? 'error' : ''}`}
                type="text"
                placeholder="e.g. ABCD-1234"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); setCodeOk(''); }}
                maxLength={9}
                spellCheck={false}
              />
              <button className="stu-btn-primary" type="submit" disabled={joining || !codeInput.trim()}>
                {joining ? 'Joining…' : 'Join'}
              </button>
            </form>
            {codeError && <div className="stu-code-error">⚠ {codeError}</div>}
            {codeOk    && <div className="stu-code-ok">✓ {codeOk}</div>}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="stu-assess-card">
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: '45%', background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 11, width: '30%', background: '#f0f0f0', borderRadius: 4 }} />
              </div>
            </div>
          ))
        ) : shown.length === 0 ? (
          <div className="stu-assess-empty">
            {activeTab === 'Available'
              ? 'No available assessments. Use the code box above to join one.'
              : activeTab === 'Upcoming'
              ? 'No upcoming assessments scheduled.'
              : 'No completed assessments yet. Take one to see results here.'}
          </div>
        ) : (
          shown.map(a => {
            const isScheduled = a.status === 'Scheduled';
            const closeLbl    = a.closeAt && !a.submitted ? closesLabel(a.closeAt, now) : null;
            const urgent      = a.closeAt && (new Date(a.closeAt) - now) < 86_400_000;

            return (
              <div key={a.id} className="stu-assess-card">
                <div className="stu-assess-card-left">
                  <div className="stu-assess-card-title">{a.title}</div>
                  <div className="stu-assess-card-meta">
                    {a.topic || 'No topic'} · {a.questions} question{a.questions !== 1 ? 's' : ''} · {a.maxMarks} marks
                    {a.duration && ` · ${a.duration} min`}
                  </div>
                  {/* Countdown / schedule labels */}
                  {isScheduled && a.openAt && (
                    <div className="stu-assess-card-due">{opensLabel(a.openAt)}</div>
                  )}
                  {!isScheduled && closeLbl && (
                    <div className={`stu-assess-card-due ${urgent ? 'stu-urgent' : ''}`}>
                      {closeLbl}
                    </div>
                  )}
                </div>

                <div className="stu-assess-card-right">
                  {a.submitted ? (
                    <>
                      {a.pct !== null && (
                        <div className={`stu-assess-score ${scoreClass(a.pct)}`}>{a.pct}%</div>
                      )}
                      <span className={`stu-badge ${a.status === 'Graded' ? 'stu-badge-graded' : 'stu-badge-pending'}`}>
                        {a.status ?? 'Submitted'}
                      </span>
                      {a.status === 'Graded' && (
                        <button className="stu-btn-ghost" onClick={() => onNavigate('results')}>
                          View
                        </button>
                      )}
                    </>
                  ) : isScheduled ? (
                    <span className="stu-badge stu-badge-scheduled">{opensLabel(a.openAt)}</span>
                  ) : a.status === 'Closed' ? (
                    <span className="stu-badge stu-badge-closed">Closed</span>
                  ) : (
                    <button
                      className="stu-btn-primary"
                      onClick={() => onNavigate('take-test', {
                        id: a.id, title: a.title, topic: a.topic,
                        duration_minutes: a.duration,
                      })}
                    >
                      Start →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {toast && <div className="stu-assess-toast">{toast}</div>}
    </div>
  );
}

export default StudentAssessments;