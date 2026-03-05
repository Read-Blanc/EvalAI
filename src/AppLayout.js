import React from 'react';
import Sidebar from './Sidebar';
import './AppLayout.css';

function AppLayout({ currentPage, onNavigate, children }) {
  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="app-layout-main">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
