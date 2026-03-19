/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../UserContext';
import { supabase } from '../supabaseClient';
import '../lecturer/DashboardPage.css';
import './Dashboard.css';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

function Skeleton({ style = {} }) {
  return <div className="dash-skeleton" style={style} />;
}

function StatusBadge({ status }) {
  const cls = status === 'Graded' ? 'badge-graded' : 'badge-pending';
  return <span className={`stu-badge ${cls}`}>{status}</span>;
}

// Notification hook for students
function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const channelRef = useRef(null);

  const add = useCallback((notif) => {
    setNotifications(prev => [
      { id: crypto.randomUUID(), ts: Date.now(), read: false, ...notif },
      ...prev,
    ].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!user?.id || user?.role !== 'student') return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`notifs-student-${user.id}`);

    channel.on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `student_id=eq.${user.id}` },
      async (payload) => {
        if (payload.new?.status !== 'Graded') return;
        const subId = payload.new?.id;

        const { data } = await supabase
          .from('submissions')
          .select('assessments(title)')
          .eq('id', subId)
          .single();

        const title = data?.assessments?.title ?? 'your submission';

        add({
          type:  'graded',
          icon:  '✅',
          title: 'Submission graded',
          body:  `"${title}" has been graded`,
          href:  `results/${subId}`,
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
    if (n.href) {
      // href like "results/abc" -> navigate to "result-detail" with id
      if (n.href.startsWith('results/')) {
        onNavigate('results');
      } else {
        onNavigate(n.href.replace('/', '-'));
      }
    }
  };

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="dash-card-title">
          Notifications
          {unreadCount > 0 && (
            <span className="dash-notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
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
            <button key={n.id} onClick={() => handleClick(n)}
              className={`dash-notif-item ${n.read ? 'dash-notif-read' : ''}`}>
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

export default function StudentDashboard({ onNavigate }) {
  const { user }    = useUser();
  const firstName   = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  const [stats,   setStats]   = useState({ available: 0, submitted: 0, graded: 0, avgScore: null });
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications(user);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [{ data: enrolled }, { data: submissions }] = await Promise.all([
      supabase
        .from('assessment_students')
        .select('assessments(id, title, topic, status)')
        .eq('student_id', user.id),
      supabase
        .from('submissions')
        .select(`id, status, submitted_at,
          assessments(title, topic, questions(marks)),
          answers(marks_awarded)`)
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5),
    ]);

    const available = (enrolled ?? []).filter(e => e.assessments?.status === 'Active').length;
    const subList   = submissions ?? [];
    const graded    = subList.filter(s => s.status === 'Graded');

    let avgScore = null;
    if (graded.length > 0) {
      const totals = graded.map(s => {
        const max     = s.assessments?.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) ?? 0;
        const awarded = s.answers?.reduce((sum, a) => sum + (a.marks_awarded || 0), 0) ?? 0;
        return max > 0 ? (awarded / max) * 100 : null;
      }).filter(Boolean);
      if (totals.length) avgScore = Math.round(totals.reduce((a, b) => a + b) / totals.length);
    }

    setStats({ available, submitted: subList.length, graded: graded.length, avgScore });

    setRecent(subList.map(s => ({
      id:     s.id,
      title:  s.assessments?.title ?? '—',
      topic:  s.assessments?.topic ?? '',
      status: s.status,
      date:   s.submitted_at
        ? new Date(s.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : '—',
    })));

    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const STAT_CARDS = [
    { label: 'Available',  value: stats.available, sub: 'active assessments',
      icon: '📋' },
    { label: 'Submitted',  value: stats.submitted, sub: 'total submissions',
      icon: '📤' },
    { label: 'Graded',     value: stats.graded,    sub: 'results available',
      icon: '✅' },
    { label: 'Avg. Score', value: stats.avgScore !== null ? `${stats.avgScore}%` : '—', sub: 'across graded',
      icon: '📊' },
  ];

  return (
    <div>
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-breadcrumb">
          <span>Home</span><span className="sep">/</span><span>Dashboard</span>
        </div>
        <div className="dash-topbar-actions">
          <button className="dash-btn-primary" onClick={() => onNavigate('student-assessments')}>
            Take Assessment
          </button>
        </div>
      </div>

      <div className="dash-content">
        {/* Welcome */}
        <div className="dash-welcome">
          <div className="dash-welcome-greeting">Good {greeting()}, {firstName}</div>
          <div className="dash-welcome-sub">Here's a summary of your progress.</div>
          <div className="dash-welcome-date">{today}</div>
        </div>

        {/* Stat cards */}
        <div className="dash-stats-row">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="dash-stat-card">
              <div className="dash-stat-icon-box">{s.icon}</div>
              <div className="dash-stat-label">{s.label}</div>
              {loading
                ? <Skeleton style={{ height: 36, width: 56, marginBottom: 4 }} />
                : <div className="dash-stat-value">{s.value}</div>
              }
              <div className="dash-stat-delta">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main row */}
        <div className="dash-grid-3col">

          {/* Recent submissions */}
          <div className="dash-card" style={{ gridColumn: 'span 2' }}>
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Recent Submissions</div>
                <div className="dash-card-subtitle">Your latest submitted assessments</div>
              </div>
              <a className="dash-card-action" href="#results"
                onClick={e => { e.preventDefault(); onNavigate('results'); }}>
                View all →
              </a>
            </div>

            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="dash-queue-item">
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ height: 12, width: '50%', marginBottom: 6 }} />
                    <Skeleton style={{ height: 10, width: '35%' }} />
                  </div>
                </div>
              ))
            ) : recent.length === 0 ? (
              <div className="dash-empty-state">
                No submissions yet. Take an assessment to get started.
              </div>
            ) : (
              recent.map(r => (
                <div key={r.id} className="dash-queue-item stu-clickable"
                  onClick={() => onNavigate('result-detail', r)}>
                  <div className="dash-queue-info">
                    <div className="dash-queue-name">{r.title}</div>
                    <div className="dash-queue-meta">{r.topic || 'No topic'} · {r.date}</div>
                  </div>
                  <StatusBadge status={r.status} />
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

        {/* Quick Actions */}
        <div className="dash-card" style={{ marginTop: 16 }}>
          <div className="dash-card-header">
            <div className="dash-card-title">Quick Actions</div>
          </div>
          <div className="dash-qa-grid">
            {[
              { icon: '📝', label: 'Take Assessment', desc: 'Start an available test',  page: 'student-assessments' },
              { icon: '📄', label: 'Past Results',    desc: 'View graded submissions',  page: 'results'             },
              { icon: '📈', label: 'Performance',     desc: 'Your score trends',        page: 'student-analytics'   },
              { icon: '⚙️', label: 'Settings',        desc: 'Account & preferences',    page: 'settings'            },
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