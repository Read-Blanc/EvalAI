/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './Analytics.css';

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreColor(pct) {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(pct) {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Good';
  if (pct >= 60) return 'Satisfactory';
  return 'Needs Work';
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Component ──────────────────────────────────────────────────────────────
function Analytics() {
  const { user } = useUser();

  const [loading,     setLoading]     = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [answers,     setAnswers]     = useState([]);

  const load = useCallback(async () => {
    setLoading(true);

    // All graded submissions, oldest-first for the trend chart
    const { data: subs } = await supabase
      .from('submissions')
      .select('id, submitted_at, assessments(title, topic)')
      .eq('student_id', user.id)
      .eq('status', 'Graded')
      .order('submitted_at', { ascending: true });

    if (!subs?.length) {
      setSubmissions([]);
      setAnswers([]);
      setLoading(false);
      return;
    }

    // Answers for scoring
    const { data: ans } = await supabase
      .from('answers')
      .select('submission_id, marks_awarded, questions(marks, text, order_index)')
      .in('submission_id', subs.map(s => s.id));

    setSubmissions(subs);
    setAnswers(ans ?? []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  let stats = null;

  if (!loading && submissions.length > 0) {

    // Per-submission score
    const subScores = submissions.map(s => {
      const subAnswers = answers.filter(a => a.submission_id === s.id);
      const awarded    = subAnswers.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0);
      const max        = subAnswers.reduce((sum, a) => sum + (a.questions?.marks ?? 0), 0);
      const pct        = max > 0 ? Math.round((awarded / max) * 100) : null;
      return {
        id:    s.id,
        title: s.assessments?.title ?? '—',
        topic: s.assessments?.topic ?? '',
        date:  s.submitted_at,
        pct,
      };
    });

    const scored = subScores.filter(s => s.pct !== null);
    const avg    = scored.length
      ? Math.round(scored.reduce((a, b) => a + b.pct, 0) / scored.length)
      : null;
    const best   = scored.length ? Math.max(...scored.map(s => s.pct)) : null;
    const topics = [...new Set(subScores.map(s => s.topic).filter(Boolean))];

    // Per-question performance
    const qMap = {};
    answers.forEach(a => {
      if (a.marks_awarded === null || !a.questions) return;
      const key = a.questions.text;
      if (!qMap[key]) qMap[key] = { text: key, order: a.questions.order_index ?? 0, aw: 0, max: 0, n: 0 };
      qMap[key].aw  += a.marks_awarded;
      qMap[key].max += a.questions.marks;
      qMap[key].n++;
    });

    const qPerf = Object.values(qMap)
      .sort((a, b) => a.order - b.order)
      .map((q, i) => ({
        idx: i + 1,
        text: q.text,
        pct:  q.max > 0 ? Math.round((q.aw / q.max) * 100) : null,
        aw:   q.n   > 0 ? +(q.aw  / q.n).toFixed(1) : null,
        max:  q.n   > 0 ? +(q.max / q.n).toFixed(1) : null,
      }));

    stats = { subScores, avg, best, topics, qPerf };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="san-page">

      {/* Topbar */}
      <div className="san-topbar">
        <div className="san-topbar-title">My Analytics</div>
        <div className="san-topbar-sub">Your performance across graded assessments</div>
      </div>

      <div className="san-body">

        {loading ? (
          <div className="san-empty">Loading your analytics…</div>

        ) : !stats ? (
          <div className="san-empty">
            No graded assessments yet. Complete and get graded on an assessment to see your analytics here.
          </div>

        ) : (
          <>
            {/* Stat cards */}
            <div className="san-stats-row">
              <div className="san-stat-card">
                <div className="san-stat-label">Completed</div>
                <div className="san-stat-value">{stats.subScores.length}</div>
                <div className="san-stat-sub">
                  graded assessment{stats.subScores.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="san-stat-card">
                <div className="san-stat-label">Average Score</div>
                <div className="san-stat-value"
                  style={{ color: stats.avg != null ? scoreColor(stats.avg) : '#999' }}>
                  {stats.avg != null ? `${stats.avg}%` : '—'}
                </div>
                <div className="san-stat-sub">
                  {stats.avg != null ? scoreLabel(stats.avg) : 'no data yet'}
                </div>
              </div>
              <div className="san-stat-card">
                <div className="san-stat-label">Best Score</div>
                <div className="san-stat-value"
                  style={{ color: stats.best != null ? scoreColor(stats.best) : '#999' }}>
                  {stats.best != null ? `${stats.best}%` : '—'}
                </div>
                <div className="san-stat-sub">personal best</div>
              </div>
              <div className="san-stat-card">
                <div className="san-stat-label">Topics Covered</div>
                <div className="san-stat-value">{stats.topics.length}</div>
                <div className="san-stat-sub">
                  {stats.topics.length > 0
                    ? stats.topics.slice(0, 2).join(', ') + (stats.topics.length > 2 ? '…' : '')
                    : 'no topics tagged'}
                </div>
              </div>
            </div>

            {/* Score trend bar chart */}
            <div className="san-card">
              <div className="san-card-header">
                <div className="san-card-title">Performance Over Time</div>
                <div className="san-card-sub">
                  Score % per graded assessment, oldest to newest
                </div>
              </div>
              <div className="san-bar-chart-wrap">
                <div className="san-bar-chart">
                  {stats.subScores.filter(s => s.pct !== null).map((s, i) => (
                    <div key={s.id} className="san-bar-col">
                      <div className="san-bar-pct" style={{ color: scoreColor(s.pct) }}>
                        {s.pct}%
                      </div>
                      <div className="san-bar"
                        style={{ height: `${s.pct}%`, background: scoreColor(s.pct) }}
                        title={`${s.title}: ${s.pct}%`}
                      />
                      <div className="san-bar-label" title={s.title}>
                        {s.title.length > 12 ? `${s.title.slice(0, 12)}…` : s.title}
                      </div>
                      <div className="san-bar-date">{shortDate(s.date)}</div>
                    </div>
                  ))}
                </div>
                {/* Y-axis reference lines */}
                <div className="san-y-lines" aria-hidden="true">
                  {[100, 75, 50, 25].map(v => (
                    <div key={v} className="san-y-line" style={{ bottom: `${v}%` }}>
                      <span className="san-y-label">{v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Assessment breakdown + per-question breakdown */}
            <div className="san-grid-2">

              {/* Assessment scores */}
              <div className="san-card">
                <div className="san-card-header">
                  <div className="san-card-title">Assessment Breakdown</div>
                  <div className="san-card-sub">Your score for each graded assessment</div>
                </div>
                <div className="san-dist-list">
                  {[...stats.subScores].reverse().map(s => (
                    <div key={s.id} className="san-dist-row">
                      <div className="san-dist-label" title={s.title}>
                        {s.title.length > 16 ? `${s.title.slice(0, 16)}…` : s.title}
                      </div>
                      <div className="san-dist-track">
                        {s.pct != null && (
                          <div className="san-dist-fill"
                            style={{ width: `${s.pct}%`, background: scoreColor(s.pct) }} />
                        )}
                      </div>
                      <div className="san-dist-count"
                        style={{ color: s.pct != null ? scoreColor(s.pct) : '#999' }}>
                        {s.pct != null ? `${s.pct}%` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-question performance */}
              <div className="san-card">
                <div className="san-card-header">
                  <div className="san-card-title">Question Performance</div>
                  <div className="san-card-sub">Average marks earned per question type</div>
                </div>
                {stats.qPerf.length === 0 ? (
                  <div className="san-empty-inner">No question data available yet.</div>
                ) : (
                  <>
                    <div className="san-dist-list">
                      {stats.qPerf.map(q => (
                        <div key={q.idx} className="san-dist-row">
                          <div className="san-dist-label san-dist-label-q" title={q.text}>
                            Q{q.idx}
                          </div>
                          <div className="san-dist-track">
                            {q.pct != null && (
                              <div className="san-dist-fill"
                                style={{ width: `${q.pct}%`, background: scoreColor(q.pct) }} />
                            )}
                          </div>
                          <div className="san-dist-count">
                            {q.aw != null ? `${q.aw} / ${q.max}` : '—'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Focus area hint */}
                    {(() => {
                      const worst = [...stats.qPerf]
                        .filter(q => q.pct !== null)
                        .sort((a, b) => a.pct - b.pct)[0];
                      return worst ? (
                        <div className="san-q-hint">
                          Focus area: <strong>Q{worst.idx}</strong> ({worst.pct}% avg)
                        </div>
                      ) : null;
                    })()}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;