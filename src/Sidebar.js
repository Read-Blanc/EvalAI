import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import './Sidebar.css';

const LECTURER_NAV = [
  { key: 'dashboard',   label: 'Dashboard'     },
  { key: 'assessments', label: 'Assessments'   },
  { key: 'grading',     label: 'Grading Queue' },
  { key: 'analytics',   label: 'Analytics'     },
];

const STUDENT_NAV = [
  { key: 'student-dashboard',   label: 'Dashboard'   },
  { key: 'student-assessments', label: 'Assessments' },
  { key: 'results',             label: 'My Results'  },
  { key: 'student-analytics',   label: 'Performance' },
];

function getInitials(user) {
  if (user?.fullName) {
    const parts = user.fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return (user?.email ?? 'U').slice(0, 2).toUpperCase();
}

function Sidebar({ currentPage, onNavigate }) {
  const { user, logout } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems    = user?.role === 'student' ? STUDENT_NAV : LECTURER_NAV;
  const initials    = getInitials(user);
  const displayRole = user?.role === 'student' ? 'Student' : 'Lecturer';
  const displayName = user?.fullName || user?.email || 'Guest';

  // Close sidebar when route changes
  useEffect(() => { setMobileOpen(false); }, [currentPage]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleNavigate = (key) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="2" y1="2" x2="16" y2="16" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="2" x2="2" y2="16" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="2" y1="4"  x2="16" y2="4"  stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2" y1="9"  x2="16" y2="9"  stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2" y1="14" x2="16" y2="14" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay open" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="logo-section">
          <div className="logo-box">EvalAI</div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-label">MENU</div>
          <ul>
            {navItems.map((item) => (
              <li key={item.key} className={currentPage === item.key ? 'active' : ''}>
                <a
                  href={`#${item.key}`}
                  onClick={(e) => { e.preventDefault(); handleNavigate(item.key); }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="settings-section">
            <a
              href="#settings"
              className={currentPage === 'settings' ? 'active-link' : ''}
              onClick={(e) => { e.preventDefault(); handleNavigate('settings'); }}
            >
              Settings
            </a>
          </div>

          <div className="user-profile">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <p className="user-name">{displayName}</p>
              <p className="user-role">{displayRole}</p>
            </div>
          </div>

          <div className="settings-section" style={{ marginTop: 8 }}>
            <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); }}>
              Log Out
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;