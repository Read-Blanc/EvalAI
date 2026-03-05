import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './GradingQueue.css';

const FILTERS = [
  { key: 'All',            label: 'All'            },
  { key: 'Pending Review', label: 'Pending Review' },
  { key: 'Graded',         label: 'Graded'         },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function statusClass(s) {
  return {
    'Pending Review': 'gq-chip-review',
    'Graded':         'gq-chip-approved',
  }[s] ?? '';
}

// Generate a stable avatar colour from a name string
function avatarColor(str) {
  const palette = ['#667eea', '#f59e0b', '#ef4444', '#10b981', '#764ba2', '#3b82f6', '#6366f1', '#0ea5e9'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

// ── Component ──────────────────────────────────────────────────────────────
function GradingQueue({ onNavigate }) {
  const { user } = useUser();

  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  // ── Fetch all submissions for the lecturer's assessments ──────────────────
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);

    // Step 1: get the IDs of assessments this lecturer created
    const { data: myAssessments, error: aErr } = await supabase
      .from('assessments')
      .select('id')
      .eq('created_by', user.id);

    if (aErr || !myAssessments || myAssessments.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const assessmentIds = myAssessments.map(a => a.id);

    // Step 2: get submissions for those assessments, with assessment title
    const { data: subs, error: sErr } = await supabase
      .from('submissions')
      .select('id, submitted_at, status, assessment_id, student_id, assessments ( title )')
      .in('assessment_id', assessmentIds)
      .order('submitted_at', { ascending: false });

    if (sErr || !subs) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    // Step 3: get student names from profiles
    const studentIds = [...new Set(subs.map(s => s.student_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds);

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));

    setSubmissions(
      subs.map(s => {
        const name = profileMap[s.student_id] ?? 'Unknown Student';
        return {
          id:              s.id,
          studentName:     name,
          initials:        initials(name),
          color:           avatarColor(name),
          assessmentTitle: s.assessments?.title ?? '—',
          assessmentId:    s.assessment_id,
          studentId:       s.student_id,
          status:          s.status,
          submittedAt:     s.submitted_at,
          date:            new Date(s.submitted_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          }),
        };
      })
    );
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // ── Derived values ────────────────────────────────────────────────────────
  const visible = activeFilter === 'All'
    ? submissions
    : submissions.filter(s => s.status === activeFilter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'All'
      ? submissions.length
      : submissions.filter(s => s.status === f.key).length;
    return acc;
  }, {});

  const graded = submissions.filter(s => s.status === 'Graded').length;
  const total  = submissions.length;

  return (
    <div className="gq-page">

      {/* Topbar */}
      <div className="gq-topbar">
        <div>
          <div className="gq-topbar-title">Grading Queue</div>
          <div className="gq-topbar-sub">
            {loading ? 'Loading…' : (
              <>
                {graded} of {total} graded
                {total > 0 && (
                  <span className="gq-progress-inline">
                    <span
                      className="gq-progress-inline-fill"
                      style={{ width: `${Math.round((graded / total) * 100)}%` }}
                    />
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="gq-filter-row">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`gq-filter-tab ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
            <span className="gq-filter-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Submissions table */}
      <div className="gq-table-card">
        <table className="gq-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Assessment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="gq-empty">Loading submissions…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="gq-empty">
                  {activeFilter === 'All'
                    ? 'No submissions yet.'
                    : `No ${activeFilter.toLowerCase()} submissions.`}
                </td>
              </tr>
            ) : (
              visible.map(sub => (
                <tr
                  key={sub.id}
                  className="gq-row"
                  onClick={() => onNavigate('grading-detail', sub)}
                >
                  <td>
                    <div className="gq-student">
                      <div className="gq-avatar" style={{ background: sub.color }}>
                        {sub.initials}
                      </div>
                      <div className="gq-student-name">{sub.studentName}</div>
                    </div>
                  </td>
                  <td className="gq-cell-assess">{sub.assessmentTitle}</td>
                  <td>
                    <span className={`gq-status-chip ${statusClass(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="gq-cell-date">{sub.date}</td>
                  <td>
                    <button
                      className="gq-review-btn"
                      onClick={(e) => { e.stopPropagation(); onNavigate('grading-detail', sub); }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default GradingQueue;
