/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './GradingQueue.css';

const FILTERS   = ['All', 'Pending', 'Graded'];
const PAGE_SIZE = 20;

// ── Helpers ────────────────────────────────────────────────────────────────
function initials(n = '') {
  return n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';
}

function avatarColor(str) {
  const palette = ['#667eea', '#f59e0b', '#ef4444', '#10b981', '#764ba2', '#3b82f6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function statusClass(s) {
  return { Pending: 'gq-chip-review', Graded: 'gq-chip-approved' }[s] ?? '';
}

function exportCSV(rows) {
  const headers = ['Student', 'Assessment', 'Status', 'Awarded', 'Max Marks', 'Percentage', 'Submitted'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      `"${r.studentName}"`,
      `"${r.assessmentTitle}"`,
      r.status,
      r.awardedMarks ?? '',
      r.totalMarks   ?? '',
      r.pct != null ? `${r.pct}%` : '',
      r.date,
    ].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `grading-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────
function GradingQueue({ onNavigate }) {
  const { user } = useUser();

  const [submissions,      setSubmissions]      = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [activeFilter,     setActiveFilter]     = useState('All');
  const [search,           setSearch]           = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [assessmentList,   setAssessmentList]   = useState([]);
  const [selected,         setSelected]         = useState(new Set());
  const [bulkApproving,    setBulkApproving]    = useState(false);
  const [toast,            setToast]            = useState('');
  const [page,             setPage]             = useState(1);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);

    // Get assessments this lecturer created
    const { data: myAsms } = await supabase
      .from('assessments')
      .select('id')
      .eq('created_by', user.id);

    if (!myAsms?.length) { setSubmissions([]); setLoading(false); return; }

    const asmIds = myAsms.map(a => a.id);

    const { data, error } = await supabase
      .from('submissions')
      .select(`id, status, submitted_at,
        assessment_id,
        assessments(id, title, questions(marks)),
        profiles(full_name, email),
        answers(id, marks_awarded, ai_score, questions(marks))`)
      .in('assessment_id', asmIds)
      .order('submitted_at', { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const mapped = data.map(s => {
      const name       = s.profiles?.full_name || s.profiles?.email || 'Unknown';
      const totalMarks = s.assessments?.questions?.reduce((sum, q) => sum + (q.marks ?? 0), 0) ?? 0;
      const awarded    = s.answers?.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0) ?? 0;
      const hasAI      = s.answers?.some(a => a.ai_score !== null);
      const pct        = s.status === 'Graded' && totalMarks > 0
        ? Math.round((awarded / totalMarks) * 100)
        : null;
      return {
        id:              s.id,
        studentName:     name,
        initials:        initials(name),
        color:           avatarColor(name),
        assessmentTitle: s.assessments?.title ?? '—',
        assessmentId:    s.assessments?.id ?? s.assessment_id,
        status:          s.status ?? 'Pending',
        totalMarks,
        awardedMarks:    s.status === 'Graded' ? awarded : null,
        pct,
        hasAI,
        answers:         s.answers ?? [],
        date:            s.submitted_at
          ? new Date(s.submitted_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
          : '—',
      };
    });

    setSubmissions(mapped);

    // Build unique assessment list for filter dropdown
    const seen = new Map();
    mapped.forEach(m => {
      if (!seen.has(m.assessmentId)) seen.set(m.assessmentId, m.assessmentTitle);
    });
    setAssessmentList([...seen.entries()].map(([id, title]) => ({ id, title })));

    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // Reset page + selection when filters change
  useEffect(() => { setPage(1); setSelected(new Set()); }, [activeFilter, search, assessmentFilter]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = submissions
    .filter(s => activeFilter === 'All' || s.status === activeFilter)
    .filter(s => !assessmentFilter || String(s.assessmentId) === assessmentFilter)
    .filter(s => !search || s.studentName.toLowerCase().includes(search.toLowerCase())
                          || s.assessmentTitle.toLowerCase().includes(search.toLowerCase()));

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paged       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pendingWithAI = submissions.filter(s => s.status === 'Pending' && s.hasAI);

  const counts = {
    All:     filtered.length,
    Pending: submissions.filter(s => s.status === 'Pending').length,
    Graded:  submissions.filter(s => s.status === 'Graded').length,
  };

  const pendingPageIds  = paged.filter(s => s.status === 'Pending').map(s => s.id);
  const allPageSelected = pendingPageIds.length > 0 && pendingPageIds.every(id => selected.has(id));

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => setSelected(prev => {
    const next = new Set(prev);
    pendingPageIds.forEach(id => allPageSelected ? next.delete(id) : next.add(id));
    return next;
  });

  // ── Bulk approve AI scores ─────────────────────────────────────────────────
  const handleBulkApprove = async (targetIds) => {
    if (!targetIds.length) return;
    setBulkApproving(true);
    let approved = 0;

    for (const subId of targetIds) {
      const sub = submissions.find(s => s.id === subId);
      if (!sub || sub.status === 'Graded') continue;

      for (const ans of sub.answers) {
        if (ans.ai_score !== null) {
          const marks = Math.round(ans.ai_score * (ans.questions?.marks ?? 0));
          await supabase.from('answers').update({ marks_awarded: marks }).eq('id', ans.id);
        }
      }
      await supabase.from('submissions').update({ status: 'Graded' }).eq('id', subId);
      approved++;
    }

    setBulkApproving(false);
    setSelected(new Set());
    showToast(`✓ ${approved} submission${approved !== 1 ? 's' : ''} approved.`);
    fetchSubmissions();
  };

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
                    <span className="gq-progress-inline-fill"
                      style={{ width: `${Math.round((graded / total) * 100)}%` }} />
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="gq-topbar-actions">
          {/* Assessment filter */}
          <select
            className="gq-filter-select"
            value={assessmentFilter}
            onChange={e => setAssessmentFilter(e.target.value)}
          >
            <option value="">All Assessments</option>
            {assessmentList.map(a => (
              <option key={a.id} value={String(a.id)}>{a.title}</option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            className="gq-search-input"
            placeholder="Search student…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* CSV export */}
          <button className="gq-btn-outline" onClick={() => exportCSV(filtered)}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Filter tabs + bulk bar */}
      <div className="gq-filter-bar">
        <div className="gq-filter-row">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`gq-filter-tab ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
              <span className="gq-filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        <div className="gq-bulk-bar">
          {selected.size > 0 ? (
            <>
              <span className="gq-bulk-info">{selected.size} selected</span>
              <button
                className="gq-btn-approve"
                onClick={() => handleBulkApprove([...selected])}
                disabled={bulkApproving}
              >
                {bulkApproving ? 'Approving…' : 'Approve AI Scores'}
              </button>
              <button className="gq-btn-outline" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            </>
          ) : pendingWithAI.length > 0 && (
            <button
              className="gq-btn-outline"
              onClick={() => handleBulkApprove(pendingWithAI.map(s => s.id))}
              disabled={bulkApproving}
            >
              {bulkApproving
                ? 'Approving…'
                : `Approve all AI scores (${pendingWithAI.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="gq-table-card">
        {loading ? (
          <table className="gq-table">
            <tbody>
              <tr><td colSpan={8} className="gq-empty">Loading submissions…</td></tr>
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="gq-empty-state">
            <div className="gq-empty-icon">
              {submissions.length === 0 ? '📭' : '🔍'}
            </div>
            <div className="gq-empty-title">
              {submissions.length === 0 ? 'All caught up!' : 'No results match your filters'}
            </div>
            <p className="gq-empty-desc">
              {submissions.length === 0
                ? 'No submissions yet. Once students submit they will appear here.'
                : 'Try clearing the search or filter.'}
            </p>
            {(search || assessmentFilter || activeFilter !== 'All') && (
              <button className="gq-btn-outline" onClick={() => {
                setSearch(''); setAssessmentFilter(''); setActiveFilter('All');
              }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="gq-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} />
                  </th>
                  <th>Student</th>
                  <th>Assessment</th>
                  <th>Submitted</th>
                  <th>Score</th>
                  <th>AI</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(sub => (
                  <tr key={sub.id} className="gq-row"
                    onClick={() => onNavigate('grading-detail', sub)}>
                    <td onClick={e => e.stopPropagation()}>
                      {sub.status === 'Pending' && (
                        <input type="checkbox"
                          checked={selected.has(sub.id)}
                          onChange={() => toggleSelect(sub.id)} />
                      )}
                    </td>
                    <td>
                      <div className="gq-student">
                        <div className="gq-avatar" style={{ background: sub.color }}>
                          {sub.initials}
                        </div>
                        <span className="gq-student-name">{sub.studentName}</span>
                      </div>
                    </td>
                    <td className="gq-cell-assess">{sub.assessmentTitle}</td>
                    <td className="gq-cell-date">{sub.date}</td>
                    <td>
                      {sub.pct != null ? (
                        <span className={`gq-score-val ${
                          sub.pct >= 75 ? 'gq-score-high' : sub.pct >= 50 ? 'gq-score-mid' : 'gq-score-low'
                        }`}>
                          {sub.pct}%
                        </span>
                      ) : (
                        <span className="gq-score-none">—</span>
                      )}
                    </td>
                    <td>
                      {sub.hasAI
                        ? <span className="gq-ai-badge">AI ✓</span>
                        : <span className="gq-score-none">—</span>
                      }
                    </td>
                    <td>
                      <span className={`gq-status-chip ${statusClass(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="gq-review-btn"
                        onClick={() => onNavigate('grading-detail', sub)}>
                        {sub.status === 'Graded' ? 'Review' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="gq-pagination">
                <span className="gq-page-info">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="gq-page-btns">
                  <button className="gq-btn-outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}>
                    ← Prev
                  </button>
                  <button className="gq-btn-outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <div className="gq-toast">{toast}</div>}
    </div>
  );
}

export default GradingQueue;