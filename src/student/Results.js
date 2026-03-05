import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './Results.css';

function Results({ onNavigate }) {
  const { user } = useUser();

  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);

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
        )
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
        return {
          id:          s.id,
          title:       a?.title ?? '—',
          topic:       a?.topic ?? '',
          maxMarks,
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

  return (
    <div className="res-page">

      {/* Topbar */}
      <div className="res-topbar">
        <div className="res-topbar-title">My Results</div>
        <div className="res-topbar-sub">
          {loading ? 'Loading…' : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* List */}
      <div className="res-list">
        {loading ? (
          <div className="res-empty">Loading your results…</div>
        ) : submissions.length === 0 ? (
          <div className="res-empty">
            No submissions yet. Complete an assessment to see your results here.
          </div>
        ) : (
          submissions.map((s) => (
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
                <div className="res-card-date">Submitted: {formatDate(s.submittedAt)}</div>
              </div>
              <div className="res-card-right">
                <span className={`res-badge ${s.status === 'Graded' ? 'res-badge-graded' : 'res-badge-pending'}`}>
                  {s.status}
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
