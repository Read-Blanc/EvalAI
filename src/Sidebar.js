import React from 'react';
import { useUser } from './UserContext';
import './Sidebar.css';

// Nav items shown to lecturers — full feature set
const LECTURER_NAV = [
  { key: 'dashboard',   label: 'Dashboard' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'grading',     label: 'Grading Queue' },
  { key: 'rubrics',     label: 'Rubrics' },
  { key: 'analytics',   label: 'Analytics' },
];

// Nav items shown to students
const STUDENT_NAV = [
  { key: 'student-dashboard',   label: 'Dashboard'    },
  { key: 'student-assessments', label: 'Assessments'  },
  { key: 'results',             label: 'My Results'   },
  { key: 'student-analytics',   label: 'Analytics'    },
];

function Sidebar({ currentPage, onNavigate }) {
  // Consume the UserContext to read the active user's role and the logout function.
  // This avoids needing to prop-drill role all the way from App → AppLayout → Sidebar.
  const { user, logout } = useUser();

  // Select the correct nav item set based on the user's role.
  // Defaults to the lecturer nav for any unrecognised role value.
  const navItems = user?.role === 'student' ? STUDENT_NAV : LECTURER_NAV;

  // Derive display initials from the user's email (e.g. "te" → "TE")
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';
  const displayRole = user?.role === 'student' ? 'Student' : 'Lecturer';

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="logo-box">EvalAI</div>
      </div>

      {/* Role-driven navigation list */}
      <nav className="sidebar-menu">
        <div className="menu-label">MENU</div>
        <ul>
          {navItems.map((item) => (
            <li key={item.key} className={currentPage === item.key ? 'active' : ''}>
              <a
                href={`#${item.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.key);
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {/* Settings link — only relevant for lecturers */}
        {user?.role === 'lecturer' && (
          <div className="settings-section">
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('settings');
              }}
            >
              Settings
            </a>
          </div>
        )}

        {/* User profile strip — populated from UserContext, not hardcoded */}
        <div className="user-profile">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p className="user-name">{user?.email ?? 'Guest'}</p>
            <p className="user-role">{displayRole}</p>
          </div>
        </div>

        {/* Logout — calls the logout function from UserContext which clears
            the session from localStorage and navigates back to the landing page */}
        <div className="settings-section">
          <a
            href="#logout"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            Log Out
          </a>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
