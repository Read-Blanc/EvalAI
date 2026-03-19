/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './Analytics.css';

// ── Constants ──────────────────────────────────────────────────────────────
const BANDS = [
  { label: '90–100%', color: '#10b981', test: p => p >= 90 },
  { label: '80–89%',  color: '#667eea', test: p => p >= 80 },
  { label: '70–79%',  color: '#3b82f6', test: p => p >= 70 },
  { label: '60–69%',  color: '#f59e0b', test: p => p >= 60 },
  { label: '< 60%',   color: '#ef4444', test: p => p <  60 },
];

// ── Component ──────────────────────────────────────────────────────────────
function Analytics() {
  const { user } = useUser();

  const [assessments, setAssessments] = useState([]);
  const [selectedId,  setSelectedId]  = useState('all');
  const [loading,     setLoading]     = useState(true);
  const [rawData,     setRawData]     = useState(null);

  // Load assessment list for dropdown
  useEffect(() => {
    supabase
      .from('assessments')
      .select('id, title')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAssessments(data ?? []));
  }, [user.id]);

  // Load submissions + answers whenever selection changes
  const load = useCallback(async () => {
    setLoading(true);

    const ids = selectedId === 'all'
      ? assessments.map(a => a.id)
      : [selectedId];

    if (!ids.length) { setRawData(null); setLoading(false); return; }

    const { data: subs } = await supabase
      .from('submissions')
      .select('id, status')
      .in('assessment_id', ids);

    if (!subs?.length) { setRawData({ empty: true }); setLoading(false); return; }

    const { data: answers } = await supabase
      .from('answers')
      .select('submission_id, ai_score, marks_awarded, questions(id, text, marks, order_index)')
      .in('submission_id', subs.map(s => s.id));

    setRawData({ subs, answers: answers ?? [] });
    setLoading(false);
  }, [selectedId, assessments]);

  useEffect(() => { load(); }, [load]);

  // ── Derive stats ──────────────────────────────────────────────────────────
  let stats = null;
  if (rawData && !rawData.empty) {
    const { subs, answers } = rawData;

    const graded  = subs.filter(s => s.status === 'Graded');
    const pending = subs.length - graded.length;

    // Per-submission totals
    const subMap = {};
    answers.forEach(a => {
      if (!subMap[a.submission_id]) subMap[a.submission_id] = { aw: 0, max: 0 };
      subMap[a.submission_id].aw  += a.marks_awarded ?? 0;
      subMap[a.submission_id].max += a.questions?.marks ?? 0;
    });

    const scores = graded
      .map(s => {
        const m = subMap[s.id];
        return m?.max > 0 ? Math.round((m.aw / m.max) * 100) : null;
      })
      .filter(n => n !== null);

    const avg  = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null;
    const high = scores.length ? Math.max(...scores) : null;
    const low  = scores.length ? Math.min(...scores) : null;

    // Score band distribution
    const bandCounts = BANDS.map(b => ({
      ...b,
      count: scores.filter(s => b.test(s)).length,
    }));
    const maxBand = Math.max(...bandCounts.map(b => b.count), 1);

    // Per-question averages — awarded vs AI suggested
    const qMap = {};
    answers.forEach(a => {
      if (a.marks_awarded === null || !a.questions) return;
      const q = a.questions;
      if (!qMap[q.id]) {
        qMap[q.id] = {
          text:   q.text,
          marks:  q.marks,
          order:  q.order_index ?? 0,
          aw:     0, n:   0,
          aiSum:  0, aiN: 0,
        };
      }
      qMap[q.id].aw += a.marks_awarded;
      qMap[q.id].n++;
      if (a.ai_score !== null) {
        qMap[q.id].aiSum += a.ai_score;
        qMap[q.id].aiN++;
      }
    });

    const questions = Object.values(qMap)
      .sort((a, b) => a.order - b.order)
      .map((q, i) => ({
        idx:        i + 1,
        text:       q.text,
        marks:      q.marks,
        avgAwarded: q.n   > 0 ? +(q.aw / q.n).toFixed(1)                    : null,
        avgAi:      q.aiN > 0 ? +(q.aiSum / q.aiN * q.marks).toFixed(1)     : null,
        pct:        q.n   > 0 && q.marks > 0
          ? Math.round((q.aw / q.n / q.marks) * 100)
          : null,
      }));

    stats = {
      total:      subs.length,
      graded:     graded.length,
      pending,
      gradedPct:  subs.length > 0 ? Math.round((graded.length / subs.length) * 100) : 0,
      avg, high, low,
      bandCounts, maxBand,
      questions,
      hasAi: questions.some(q => q.avgAi !== null),
    };
  }

  const selectedTitle = selectedId === 'all'
    ? 'All Assessments'
    : (assessments.find(a => a.id === selectedId)?.title ?? '');

  return (
    <div className="an-page">

      {/* Topbar */}
      <div className="an-topbar">
        <div>
          <div className="an-topbar-title">Analytics</div>
          <div className="an-topbar-sub">{selectedTitle}</div>
        </div>
        <select
          className="an-select"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="all">All Assessments</option>
          {assessments.map(a => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      <div className="an-body">
        {loading ? (
          <div className="an-empty">Loading analytics…</div>

        ) : assessments.length === 0 ? (
          <div className="an-empty">
            No assessments found. Create an assessment to see analytics here.
          </div>

        ) : !stats ? (
          <div className="an-empty">
            No submissions yet{selectedId !== 'all' ? ' for this assessment' : ''}.
          </div>

        ) : (
          <>
            {/* Stat cards */}
            <div className="an-stats-row">
              <div className="an-stat-card">
                <div className="an-stat-label">Total Submissions</div>
                <div className="an-stat-value">{stats.total}</div>
                <div className="an-stat-sub">{stats.graded} graded · {stats.pending} pending</div>
              </div>
              <div className="an-stat-card">
                <div className="an-stat-label">Grading Progress</div>
                <div className="an-stat-value">{stats.gradedPct}%</div>
                <div className="an-progress-bar">
                  <div className="an-progress-fill" style={{ width: `${stats.gradedPct}%` }} />
                </div>
              </div>
              <div className="an-stat-card">
                <div className="an-stat-label">Class Average</div>
                <div className="an-stat-value"
                  style={{ color: stats.avg != null
                    ? (stats.avg >= 75 ? '#10b981' : stats.avg >= 50 ? '#f59e0b' : '#ef4444')
                    : '#999' }}>
                  {stats.avg != null ? `${stats.avg}%` : '—'}
                </div>
                <div className="an-stat-sub">
                  {stats.avg != null ? 'across graded submissions' : 'no graded data yet'}
                </div>
              </div>
              <div className="an-stat-card">
                <div className="an-stat-label">Score Range</div>
                <div className="an-stat-value">
                  {stats.high != null ? `${stats.low}–${stats.high}%` : '—'}
                </div>
                <div className="an-stat-sub">lowest to highest</div>
              </div>
            </div>

            {/* Charts row */}
            <div className="an-grid-2">

              {/* Score Distribution */}
              <div className="an-card">
                <div className="an-card-header">
                  <div className="an-card-title">Score Distribution</div>
                  <div className="an-card-sub">
                    {stats.graded} graded submission{stats.graded !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="an-dist-list">
                  {stats.bandCounts.map(b => (
                    <div key={b.label} className="an-dist-row">
                      <div className="an-dist-label">{b.label}</div>
                      <div className="an-dist-track">
                        <div className="an-dist-fill"
                          style={{ width: `${(b.count / stats.maxBand) * 100}%`, background: b.color }} />
                      </div>
                      <div className="an-dist-count">{b.count}</div>
                    </div>
                  ))}
                </div>
                {stats.avg != null && (
                  <div className="an-dist-footer">
                    <span>Average: <strong>{stats.avg}%</strong></span>
                    <span>Highest: <strong>{stats.high}%</strong></span>
                    <span>Lowest: <strong>{stats.low}%</strong></span>
                  </div>
                )}
              </div>

              {/* Per-Question Breakdown */}
              <div className="an-card">
                <div className="an-card-header">
                  <div className="an-card-title">Per-Question Breakdown</div>
                  <div className="an-card-sub">Average marks awarded per question</div>
                </div>
                {stats.questions.length === 0 ? (
                  <div className="an-empty-inner">No question data available.</div>
                ) : (
                  <div className="an-dist-list">
                    {stats.questions.map(q => (
                      <div key={q.idx} className="an-dist-row">
                        <div className="an-dist-label an-dist-label-q" title={q.text}>
                          Q{q.idx}
                        </div>
                        <div className="an-dist-track">
                          {q.pct != null && (
                            <div className="an-dist-fill"
                              style={{
                                width: `${q.pct}%`,
                                background: q.pct >= 75 ? '#10b981' : q.pct >= 50 ? '#f59e0b' : '#ef4444',
                              }} />
                          )}
                        </div>
                        <div className="an-dist-count">
                          {q.avgAwarded != null ? `${q.avgAwarded} / ${q.marks}` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── AI vs Manual comparison table ── */}
            {stats.hasAi && (
              <div className="an-card an-card-full">
                <div className="an-card-header">
                  <div className="an-card-title">AI Scoring vs Final Marks</div>
                  <div className="an-card-sub">
                    Average AI-suggested mark compared to final awarded mark per question
                  </div>
                </div>
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Max</th>
                        <th>Avg AI Suggested</th>
                        <th>Avg Awarded</th>
                        <th>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.questions.map(q => {
                        const diff = q.avgAi != null && q.avgAwarded != null
                          ? +(q.avgAwarded - q.avgAi).toFixed(1)
                          : null;
                        return (
                          <tr key={q.idx}>
                            <td>
                              <div className="an-q-num">Q{q.idx}</div>
                              <div className="an-q-text">
                                {q.text?.length > 80 ? `${q.text.slice(0, 80)}…` : q.text}
                              </div>
                            </td>
                            <td className="an-td-num">{q.marks}</td>
                            <td className="an-td-num">{q.avgAi ?? '—'}</td>
                            <td className="an-td-num">{q.avgAwarded ?? '—'}</td>
                            <td className="an-td-num">
                              {diff != null ? (
                                <span className={`an-diff ${
                                  diff > 0 ? 'an-diff-up' : diff < 0 ? 'an-diff-down' : 'an-diff-neutral'
                                }`}>
                                  {diff > 0 ? '+' : ''}{diff}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;