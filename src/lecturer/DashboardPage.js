/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../UserContext';
import { supabase } from '../supabaseClient';
import './DashboardPage.css';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(n = '') {
  return n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';
}

// Tiny sparkline SVG for submission trend
function Sparkline({ values }) {
  if (!values?.length || values.every(v => v === 0)) return null;
  const max = Math.max(...values, 1);
  const W = 72, H = 24;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke="#9ca3af" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Skeleton({ style = {} }) {
  return <div className="dash-skeleton" style={style} />;
}

// Inline notifications panel
function NotificationsPanel({ notifications, unreadCount, markRead, markAllRead, clearAll, onNavigate }) {
  const timeAgoShort = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)    return 'now';
    if (s < 3600)  return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const handleClick = (n) => {
    markRead(n.id);
    if (n.href) onNavigate(n.href.replace('/', '').replace('/', '-'));
  };

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">
            Notifications
            {unreadCount > 0 && (
              <span className="dash-notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </div>
        </div>
        {notifications.length > 0 && (
          <button className="dash-card-action" onClick={clearAll}>Clear all</button>
        )}
      </div>

      <div className="dash-notif-list">
        {notifications.length === 0 ? (
          <div className="dash-notif-empty">
            <span>🔔</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 8).map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`dash-notif-item ${n.read ? 'dash-notif-read' : ''}`}
            >
              <span className="dash-notif-icon">{n.icon}</span>
              <div className="dash-notif-body">
                <div className="dash-notif-title">{n.title}</div>
                <div className="dash-notif-text">{n.body}</div>
              </div>
              <div className="dash-notif-meta">
                <span>{timeAgoShort(n.ts)}</span>
                {!n.read && <span className="dash-notif-dot" />}
              </div>
            </button>
          ))
        )}
      </div>

      {unreadCount > 0 && (
        <div className="dash-notif-footer">
          <button onClick={markAllRead} className="dash-card-action">Mark all as read</button>
        </div>
      )}
    </div>
  );
}

// Toast for new notification arrivals
function NotificationToast({ notifications }) {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!notifications.length) return;
    const newest = notifications[0];
    if (!newest.read && newest.ts > Date.now() - 500) {
      setQueue(q => [...q, newest.id]);
      setTimeout(() => setQueue(q => q.filter(x => x !== newest.id)), 4000);
    }
  }, [notifications[0]?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!queue.length) return null;

  return (
    <div className="dash-toast-stack">
      {queue.map(tid => {
        const n = notifications.find(x => x.id === tid);
        if (!n) return null;
        return (
          <div key={tid} className="dash-toast-notif">
            <span>{n.icon}</span>
            <div>
              <div className="dash-toast-notif-title">{n.title}</div>
              <div>{n.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Notification hook
function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const channelRef = React.useRef(null);

  const add = useCallback((notif) => {
    setNotifications(prev => [
      { id: crypto.randomUUID(), ts: Date.now(), read: false, ...notif },
      ...prev,
    ].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!user?.id || user?.role !== 'lecturer') return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`notifs-lecturer-${user.id}`);

    channel.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'submissions' },
      async (payload) => {
        const subId = payload.new?.id;
        if (!subId) return;

        const { data } = await supabase
          .from('submissions')
          .select('profiles(full_name, email), assessments(title, created_by)')
          .eq('id', subId)
          .single();

        if (!data || data.assessments?.created_by !== user.id) return;

        const studentName = data.profiles?.full_name || data.profiles?.email || 'A student';
        const title       = data.assessments?.title ?? 'an assessment';

        add({
          type: 'new_submission',
          icon: '📝',
          title: 'New submission',
          body: `${studentName} submitted "${title}"`,
          href: '/lecturer/grading',
        });
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id, user?.role, add]);

  const markRead    = useCallback((id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);
  const clearAll    = useCallback(() => setNotifications([]), []);
  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, clearAll };
}

function scoreClass(s) {
  if (s >= 0.85) return 'dash-score-high';
  if (s >= 0.65) return 'dash-score-mid';
  return 'dash-score-low';
}

export default function DashboardPage({ onNavigate }) {
  const { user } = useUser();
  const firstName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  const [stats,   setStats]   = useState(null);
  const [pending, setPending] = useState([]);
  const [activity,setActivity]= useState([]);
  const [dist,    setDist]    = useState([]);
  const [trend,   setTrend]   = useState([]);
  const [loading, setLoading] = useState(true);

  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications(user);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [{ data: asms }, { data: allSubs }] = await Promise.all([
      supabase
        .from('assessments')
        .select('id, title, status')
        .eq('created_by', user.id),
      supabase
        .from('submissions')
        .select(`id, status, submitted_at, assessment_id,
          assessments!inner(created_by, title),
          profiles(full_name, email),
          answers(marks_awarded, questions(marks))`)
        .eq('assessments.created_by', user.id)
        .order('submitted_at', { ascending: false }),
    ]);

    const asmList = asms   ?? [];
    const subList = allSubs ?? [];

    const pendingSubs = subList.filter(s => s.status === 'Pending');
    const gradedSubs  = subList.filter(s => s.status === 'Graded');

    const scores = gradedSubs.map(s => {
      const maxM  = s.answers?.reduce((sum, a) => sum + (a.questions?.marks ?? 0), 0) ?? 0;
      const award = s.answers?.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0) ?? 0;
      return maxM > 0 ? Math.round((award / maxM) * 100) : null;
    }).filter(v => v !== null);

    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b) / scores.length)
      : null;

    // Score distribution buckets
    const buckets = [
      { label: '< 50%',  count: scores.filter(s => s < 50).length },
      { label: '50–69',  count: scores.filter(s => s >= 50 && s < 70).length },
      { label: '70–89',  count: scores.filter(s => s >= 70 && s < 90).length },
      { label: '90+',    count: scores.filter(s => s >= 90).length },
    ];
    const maxBucket = Math.max(...buckets.map(b => b.count), 1);
    setDist(buckets.map(b => ({ ...b, pct: Math.round((b.count / maxBucket) * 100) })));

    // 7-day submission trend
    const now = Date.now();
    const trendArr = Array(7).fill(0);
    subList.forEach(s => {
      if (!s.submitted_at) return;
      const diff = Math.floor((now - new Date(s.submitted_at).getTime()) / 86400000);
      if (diff >= 0 && diff < 7) trendArr[6 - diff]++;
    });
    setTrend(trendArr);

    setPending(
      pendingSubs.slice(0, 5).map(s => {
        const name = s.profiles?.full_name || s.profiles?.email || 'Unknown';
        return { id: s.id, student: name, assessment: s.assessments?.title ?? '—', initials: initials(name) };
      })
    );

    setActivity(
      subList.slice(0, 8).map(s => {
        const name = s.profiles?.full_name || s.profiles?.email || 'Student';
        const verb = s.status === 'Graded' ? 'graded' : 'submitted';
        return {
          text: `${name} ${verb} ${s.assessments?.title ?? 'an assessment'}`,
          bold: name,
          time: s.submitted_at ? timeAgo(s.submitted_at) : '—',
        };
      })
    );

    setStats({
      totalAsm:     asmList.length,
      activeAsm:    asmList.filter(a => a.status === 'Active').length,
      pendingCount: pendingSubs.length,
      avgScore,
    });

    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime: re-fetch when a new submission arrives
  useEffect(() => {
    const ch = supabase
      .channel('dashboard-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchAll]);

  const STAT_CARDS = [
    { label: 'Total Assessments', value: stats?.totalAsm,    sub: `${stats?.activeAsm ?? 0} active` },
    { label: 'Pending Review',    value: stats?.pendingCount, sub: 'awaiting grading' },
    { label: 'Avg. Class Score',  value: stats?.avgScore != null ? `${stats.avgScore}%` : '—', sub: 'across graded' },
    { label: 'Submissions (7d)',  value: trend.reduce((a, b) => a + b, 0), sub: 'last 7 days', extra: <Sparkline values={trend} /> },
  ];

  return (
    <div>
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-breadcrumb">
          <span>Home</span><span className="sep">/</span><span>Dashboard</span>
        </div>
        <div className="dash-topbar-actions">
          <button
            className="dash-btn-primary"
            onClick={() => onNavigate('grading')}
          >
            {loading ? 'Grading Queue' : `Start Grading${stats?.pendingCount ? ` (${stats.pendingCount})` : ''}`}
          </button>
        </div>
      </div>

      <div className="dash-content">
        {/* Welcome */}
        <div className="dash-welcome">
          <div className="dash-welcome-greeting">Good {greeting()}, {firstName}</div>
          <div className="dash-welcome-sub">Here's what's happening across your assessments today.</div>
          <div className="dash-welcome-date">{today}</div>
        </div>

        {/* Stat cards */}
        <div className="dash-stats-row">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="dash-stat-card">
              <div className="dash-stat-label">{s.label}</div>
              {loading ? <Skeleton style={{ height: 36, width: 64, marginBottom: 6 }} /> : (
                <div className="dash-stat-value">{s.value ?? '0'}</div>
              )}
              <div className="dash-stat-delta-row">
                <span className="dash-stat-delta">{s.sub}</span>
                {s.extra && !loading && s.extra}
              </div>
            </div>
          ))}
        </div>

        {/* Main 3-column row */}
        <div className="dash-grid-3col">

          {/* Grading Queue snapshot */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Grading Queue</div>
                <div className="dash-card-subtitle">Scripts awaiting review</div>
              </div>
              <a className="dash-card-action" href="#grading"
                onClick={e => { e.preventDefault(); onNavigate('grading'); }}>
                View all →
              </a>
            </div>

            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="dash-queue-item">
                  <Skeleton style={{ width: 36, height: 36, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ height: 12, width: '60%', marginBottom: 6 }} />
                    <Skeleton style={{ height: 10, width: '40%' }} />
                  </div>
                </div>
              ))
            ) : pending.length === 0 ? (
              <div className="dash-empty-state">All caught up — no pending submissions.</div>
            ) : (
              <>
                {pending.map(item => (
                  <div key={item.id} className="dash-queue-item"
                    onClick={() => onNavigate('grading-detail', {
                      id: item.id, status: 'Pending',
                      assessmentTitle: item.assessment,
                      studentName: item.student,
                    })}>
                    <div className="dash-queue-avatar">{item.initials}</div>
                    <div className="dash-queue-info">
                      <div className="dash-queue-name">{item.student}</div>
                      <div className="dash-queue-meta">{item.assessment}</div>
                    </div>
                    <span className="dash-status-chip dash-chip-pending">Pending</span>
                  </div>
                ))}
                <div className="dash-card-footer">
                  <button className="dash-btn-primary dash-btn-full"
                    onClick={() => onNavigate('grading')}>
                    Start Grading ({stats?.pendingCount ?? 0} pending)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title">Recent Activity</div>
            </div>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} className="dash-activity-item">
                  <Skeleton style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ height: 11, width: '80%', marginBottom: 5 }} />
                    <Skeleton style={{ height: 9, width: '25%' }} />
                  </div>
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="dash-empty-state">No activity yet.</div>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="dash-activity-item">
                  <div className="dash-activity-dot" />
                  <div>
                    <div className="dash-activity-text">
                      <strong>{a.bold}</strong>
                      {a.text.replace(a.bold, '')}
                    </div>
                    <div className="dash-activity-time">{a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notifications */}
          <NotificationsPanel
            notifications={notifications}
            unreadCount={unreadCount}
            markRead={markRead}
            markAllRead={markAllRead}
            clearAll={clearAll}
            onNavigate={onNavigate}
          />
        </div>

        {/* Bottom row: Score Distribution + Trend */}
        <div className="dash-grid-2">

          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Score Distribution</div>
                <div className="dash-card-subtitle">Graded submissions by band</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {loading ? (
                [1,2,3,4].map(i => <Skeleton key={i} style={{ height: 20, marginBottom: 12 }} />)
              ) : dist.every(d => d.count === 0) ? (
                <div className="dash-empty-state">No graded submissions yet.</div>
              ) : (
                dist.map(d => (
                  <div key={d.label} className="dash-dist-bar">
                    <div className="dash-dist-label">{d.label}</div>
                    <div className="dash-dist-track">
                      <div className="dash-dist-fill" style={{ width: `${d.pct}%` }} />
                    </div>
                    <div className="dash-dist-count">{d.count}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Submissions — Last 7 Days</div>
                <div className="dash-card-subtitle">Daily submission count</div>
              </div>
            </div>
            <div className="dash-trend-chart">
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {[1,2,3,4,5,6,7].map(i => (
                    <Skeleton key={i} style={{ flex: 1, height: `${20 + i * 8}px` }} />
                  ))}
                </div>
              ) : (
                <div className="dash-bar-chart">
                  {trend.map((v, i) => {
                    const max = Math.max(...trend, 1);
                    const h   = Math.max((v / max) * 80, v > 0 ? 8 : 2);
                    const days = ['M','T','W','T','F','S','S'];
                    const day  = days[new Date(Date.now() - (6 - i) * 86400000).getDay()];
                    return (
                      <div key={i} className="dash-bar-col">
                        <div className="dash-bar" style={{ height: `${h}px` }} />
                        <span className="dash-bar-label">{day}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-card" style={{ marginTop: 16 }}>
          <div className="dash-card-header">
            <div className="dash-card-title">Quick Actions</div>
          </div>
          <div className="dash-qa-grid">
            {[
              { icon: '➕', label: 'New Assessment', desc: 'Create a question',  page: 'assessments' },
              { icon: '📈', label: 'View Analytics',  desc: 'Scores & trends',   page: 'analytics'   },
              { icon: '⚙️', label: 'Settings',        desc: 'Account & prefs',   page: 'settings'    },
            ].map(qa => (
              <button key={qa.label} className="dash-qa-btn" onClick={() => onNavigate(qa.page)}>
                <div className="dash-qa-icon">{qa.icon}</div>
                <div>
                  <div className="dash-qa-label">{qa.label}</div>
                  <div className="dash-qa-desc">{qa.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <NotificationToast notifications={notifications} />
    </div>
  );
}