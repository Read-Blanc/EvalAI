import React from 'react';
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

  const navItems   = user?.role === 'student' ? STUDENT_NAV : LECTURER_NAV;
  const initials   = getInitials(user);
  const displayRole = user?.role === 'student' ? 'Student' : 'Lecturer';
  const displayName = user?.fullName || user?.email || 'Guest';

  return (
    <aside className="sidebar">
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
                onClick={(e) => { e.preventDefault(); onNavigate(item.key); }}
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
            onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}
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

        <div className="settings-section">
          <a
            href="#logout"
            onClick={(e) => { e.preventDefault(); logout(); }}
          >
            Log Out
          </a>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;