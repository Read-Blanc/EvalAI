import React, { useState, useEffect } from 'react';

// UserContext provides the authenticated user's session data (role, email, etc.)
// and a logout function to any component in the tree without prop drilling.
import { UserContext } from './UserContext';

// Supabase client — used here to manage session lifecycle (restore, listen, sign out)
import { supabase } from './supabaseClient';

// Public-facing pages — no login required
import SplashScreen from './SplashScreen';             // Animated intro screen on first load
import LandingPage from './LandingPage';               // Marketing home page
import LoginPage from './LoginPage';                   // Login form
import SignUpPage from './SignUpPage';                 // Registration form
import ForgotPasswordPage from './ForgotPasswordPage'; // Step 1 of password reset — email entry
import ResetPasswordPage from './ResetPasswordPage';   // Step 2 of password reset — new password

// Shared authenticated layout — wraps all logged-in pages with the sidebar
import AppLayout from './AppLayout';

// Lecturer page components
import DashboardPage from './lecturer/DashboardPage'; // Lecturer overview / home
import Assessments from './lecturer/Assessments';     // Assessment management
import GradingQueue from './lecturer/GradingQueue';   // Submissions awaiting grading review
import GradingDetail from './lecturer/GradingDetail'; // Individual submission evaluation view
import Rubrics from './lecturer/Rubrics';             // Rubric builder and management
import Analytics from './lecturer/Analytics';         // Class performance analytics

// Student page components
import StudentDashboard    from './student/Dashboard';           // Student overview / home
import StudentAssessments  from './student/StudentAssessments';  // Available + completed assessments
import StudentAnalytics    from './student/Analytics';           // Student analytics (placeholder)
import TakeTest      from './student/TakeTest';       // Test-taking interface for students
import Results       from './student/Results';        // Student's past test results
import ResultDetail  from './student/ResultDetail';   // Per-submission score breakdown

import './App.css';

// All route keys that require authentication.
// Any key in this list causes AppLayout (sidebar) to be rendered.
const AUTHENTICATED_PAGES = [
  // Lecturer routes
  'dashboard', 'assessments', 'grading', 'grading-detail', 'rubrics', 'analytics', 'settings',
  // Student routes
  'student-dashboard', 'student-assessments', 'student-analytics', 'take-test', 'results', 'result-detail',
];

// The first page each role lands on immediately after login
const ROLE_HOME = {
  lecturer: 'dashboard',
  student:  'student-dashboard',
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing');

  // Holds the authenticated user's data — set by Supabase session events, not localStorage.
  // null means unauthenticated. Shape: { id, email, fullName, role, isAuthenticated }
  const [user, setUser] = useState(null);

  // Holds the submission object selected from GradingQueue so GradingDetail can render it.
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Holds the assessment object selected from StudentAssessments so TakeTest can render it.
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Holds the submission object selected from Results so ResultDetail can render it.
  const [selectedResult, setSelectedResult] = useState(null);

  // On mount: check for an active Supabase session (handles page refresh)
  // and subscribe to auth state changes for the lifetime of the app.
  useEffect(() => {
    // Restore session if the user is already signed in from a previous visit
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) hydrateUserFromSession(session);
    });

    // onAuthStateChange fires on: sign in, sign out, token refresh, and initial load.
    // This is the single source of truth for session state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // User clicked the reset link in their email — Supabase has already
          // exchanged the token for a live session. Route to the reset form
          // instead of the normal post-login dashboard.
          setCurrentPage('reset-password');
          return;
        }
        if (session) {
          hydrateUserFromSession(session);
        } else {
          // Session ended (signed out or expired) — clear user state
          setUser(null);
        }
      }
    );

    // Clean up the listener when the App component unmounts
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetches the profiles row for the given Supabase session and sets user state.
  // Also navigates to the correct role home if the user is currently on a public page.
  const hydrateUserFromSession = async (session) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

    // Primary source: profiles table row.
    // Fallback: user_metadata written at sign-up time — covers cases where the
    // handle_new_user trigger hasn't run or the profiles row doesn't exist yet.
    const role     = profile?.role     ?? session.user.user_metadata?.role;
    const fullName = profile?.full_name ?? session.user.user_metadata?.full_name ?? '';

    if (role) {
      setUser({
        id:              session.user.id,
        email:           session.user.email,
        fullName,
        role,
        isAuthenticated: true,
      });

      // If the user is still on a public page (e.g. after a refresh), send them home.
      // reset-password is excluded so a user mid-reset isn't redirected away.
      setCurrentPage(prev =>
        ['landing', 'login', 'signup', 'forgot-password'].includes(prev)
          ? (ROLE_HOME[role] ?? 'dashboard')
          : prev
      );
    }
  };

  // Called by SplashScreen once its animation completes — reveals the app
  const handleSplashFinish = () => setShowSplash(false);

  // Central navigation handler passed to every page component and the sidebar.
  // `page` — destination route key (e.g. 'dashboard', 'take-test')
  // `data` — optional user payload for optimistic state update right after sign-in,
  //           before the Supabase onAuthStateChange listener has a chance to fire.
  const handleNavigate = (page, data) => {
    // When navigating to a grading detail view, store the submission object separately.
    // For all other pages, `data` is an optional user payload for post-login hydration.
    if (page === 'grading-detail') {
      setSelectedSubmission(data ?? null);
      setCurrentPage('grading-detail');
      return;
    }

    // When navigating to a result detail view, store the submission object.
    if (page === 'result-detail') {
      setSelectedResult(data ?? null);
      setCurrentPage('result-detail');
      return;
    }

    // When navigating to the test-taking view, store the selected assessment object.
    if (page === 'take-test') {
      setSelectedAssessment(data ?? null);
      setCurrentPage('take-test');
      return;
    }

    if (data) setUser({ ...data, isAuthenticated: true });

    const role = data?.role ?? user?.role;

    // Redirect each role to their actual home — 'dashboard' is a generic alias
    if (page === 'dashboard' && role) {
      setCurrentPage(ROLE_HOME[role] ?? 'dashboard');
    } else {
      setCurrentPage(page);
    }
  };

  // Signs the user out via Supabase (clears the session from storage automatically),
  // then returns to the landing page. onAuthStateChange will set user to null.
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('landing');
  };

  // True when the current route requires authentication (renders inside AppLayout)
  const isAuthenticated = AUTHENTICATED_PAGES.includes(currentPage);

  // Maps the active route key to its corresponding page component.
  // handleNavigate is forwarded so pages can trigger in-app navigation (e.g. "Start Grading" CTA).
  const renderPage = () => {
    switch (currentPage) {
      // --- Lecturer routes ---
      case 'dashboard':   return <DashboardPage onNavigate={handleNavigate} />;
      case 'assessments': return <Assessments    onNavigate={handleNavigate} />;
      case 'grading':        return <GradingQueue  onNavigate={handleNavigate} />;
      case 'grading-detail': return <GradingDetail submission={selectedSubmission} onNavigate={handleNavigate} />;
      case 'rubrics':     return <Rubrics       onNavigate={handleNavigate} />;
      case 'analytics':   return <Analytics     onNavigate={handleNavigate} />;

      // --- Student routes ---
      case 'student-dashboard':   return <StudentDashboard   onNavigate={handleNavigate} />;
      case 'student-assessments': return <StudentAssessments onNavigate={handleNavigate} />;
      case 'student-analytics':   return <StudentAnalytics   onNavigate={handleNavigate} />;
      case 'take-test':           return <TakeTest           assessment={selectedAssessment} onNavigate={handleNavigate} />;
      case 'results':             return <Results            onNavigate={handleNavigate} />;
      case 'result-detail':       return <ResultDetail       submission={selectedResult}    onNavigate={handleNavigate} />;

      default:            return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    // UserContext.Provider makes { user, logout } available to any component
    // in the tree (e.g. Sidebar reads role to show the correct nav items)
    <UserContext.Provider value={{ user, logout }}>
      <>
        {/* Splash screen overlay — sits on top until its animation finishes */}
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

        {/* Main app — only rendered after the splash has completed */}
        {!showSplash && (
          <>
            {/* Public pages — standalone, no sidebar */}
            {currentPage === 'landing'          && <LandingPage        onNavigate={handleNavigate} />}
            {currentPage === 'login'            && <LoginPage          onNavigate={handleNavigate} />}
            {currentPage === 'signup'           && <SignUpPage         onNavigate={handleNavigate} />}
            {currentPage === 'forgot-password'  && <ForgotPasswordPage onNavigate={handleNavigate} />}
            {currentPage === 'reset-password'   && <ResetPasswordPage  onNavigate={handleNavigate} />}

            {/* Authenticated pages — wrapped in AppLayout which renders the sidebar.
                AppLayout passes currentPage and onNavigate down to the Sidebar. */}
            {isAuthenticated && (
              <AppLayout currentPage={currentPage} onNavigate={handleNavigate}>
                {renderPage()}
              </AppLayout>
            )}
          </>
        )}
      </>
    </UserContext.Provider>
  );
}

export default App;
