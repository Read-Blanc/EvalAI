/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './Results.css';

function statusClass(status) {
  if (status === 'Graded')  return 'res-badge-graded';
  if (status === 'Pending') return 'res-badge-pending';
  return 'res-badge-default';
}

function Results({ onNavigate }) {
  const { user } = useUser();

  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All'); // All | Graded | Pending

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        submitted_at,
        status,
        assessments (
          title,
          topic,
          questions ( id, marks )
        ),
        answers ( marks_awarded )
      `)
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error || !data) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setSubmissions(
      data.map(s => {
        const a        = s.assessments;
        const maxMarks = a?.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) ?? 0;
        const awarded  = s.answers?.reduce((sum, a) => sum + (a.marks_awarded || 0), 0) ?? 0;
        const pct      = s.status === 'Graded' && maxMarks > 0
          ? Math.round((awarded / maxMarks) * 100)
          : null;
        return {
          id:          s.id,
          title:       a?.title  ?? '—',
          topic:       a?.topic  ?? '',
          maxMarks,
          awarded,
          pct,
          status:      s.status,
          submittedAt: s.submitted_at,
        };
      })
    );

    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const FILTERS = ['All', 'Graded', 'Pending'];

  const visible = filter === 'All'
    ? submissions
    : submissions.filter(s => s.status === filter);

  const counts = {
    All:     submissions.length,
    Graded:  submissions.filter(s => s.status === 'Graded').length,
    Pending: submissions.filter(s => s.status === 'Pending').length,
  };

  return (
    <div className="res-page">

      {/* Topbar */}
      <div className="res-topbar">
        <div className="res-topbar-title">My Results</div>
        <div className="res-topbar-sub">
          {loading
            ? 'Loading…'
            : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''} · ${counts.Graded} graded`}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="res-filter-row">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`res-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            <span className="res-filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="res-list">
        {loading ? (
          <div className="res-empty">Loading your results…</div>

        ) : visible.length === 0 ? (
          <div className="res-empty">
            {filter === 'All'
              ? 'No submissions yet. Complete an assessment to see your results here.'
              : `No ${filter.toLowerCase()} submissions.`}
          </div>

        ) : (
          visible.map(s => (
            <div
              key={s.id}
              className="res-card res-card-clickable"
              onClick={() => onNavigate('result-detail', s)}
            >
              <div className="res-card-left">
                <div className="res-card-title">{s.title}</div>
                <div className="res-card-meta">
                  {s.topic || 'No topic'} · {s.maxMarks} marks total
                </div>
                <div className="res-card-date">
                  Submitted: {formatDate(s.submittedAt)}
                </div>
              </div>

              <div className="res-card-right">
                {/* Score — only shown when graded */}
                {s.pct !== null && (
                  <div className={`res-score ${
                    s.pct >= 75 ? 'res-score-high' : s.pct >= 50 ? 'res-score-mid' : 'res-score-low'
                  }`}>
                    {s.pct}%
                  </div>
                )}

                <span className={`res-badge ${statusClass(s.status)}`}>
                  {s.status ?? 'Pending'}
                </span>

                <span className="res-card-arrow">›</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Results;