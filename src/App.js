/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react';

import { UserContext } from './UserContext';
import { supabase } from './supabaseClient';

// Splash & layout
import SplashScreen    from './SplashScreen';
import AppLayout       from './AppLayout';

// Public pages
import LandingPage         from './LandingPage';
import LoginPage           from './LoginPage';
import SignUpPage          from './SignUpPage';
import ForgotPasswordPage  from './ForgotPasswordPage';
import ResetPasswordPage   from './ResetPasswordPage';

// Lecturer pages
import DashboardPage  from './lecturer/DashboardPage';
import Assessments    from './lecturer/Assessments';
import GradingQueue   from './lecturer/GradingQueue';
import GradingDetail  from './lecturer/GradingDetail';
import Analytics      from './lecturer/Analytics';
import Settings       from './Settings';

// Student pages
import StudentDashboard   from './student/Dashboard';
import StudentAssessments from './student/StudentAssessments';
import StudentAnalytics   from './student/Analytics';
import TakeTest           from './student/TakeTest';
import Results            from './student/Results';
import ResultDetail       from './student/ResultDetail';

import './App.css';

const AUTHENTICATED_PAGES = [
  'dashboard', 'assessments', 'grading', 'grading-detail', 'analytics', 'settings',
  'student-dashboard', 'student-assessments', 'student-analytics', 'take-test', 'results', 'result-detail',
];

const ROLE_HOME = {
  lecturer: 'dashboard',
  student:  'student-dashboard',
};

export default function App() {
  const [showSplash,         setShowSplash]         = useState(true);
  const [currentPage,        setCurrentPage]        = useState('landing');
  const [user,               setUser]               = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedResult,     setSelectedResult]     = useState(null);

  // Restore session on mount and listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) hydrateUserFromSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setCurrentPage('reset-password');
          return;
        }
        if (session) {
          hydrateUserFromSession(session);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);  

  const hydrateUserFromSession = async (session) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

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

      setCurrentPage(prev =>
        ['landing', 'login', 'signup', 'forgot-password'].includes(prev)
          ? (ROLE_HOME[role] ?? 'dashboard')
          : prev
      );
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('landing');
  };

  const handleNavigate = (page, data) => {
    if (page === 'grading-detail') {
      setSelectedSubmission(data ?? null);
      setCurrentPage('grading-detail');
      return;
    }
    if (page === 'result-detail') {
      setSelectedResult(data ?? null);
      setCurrentPage('result-detail');
      return;
    }
    if (page === 'take-test') {
      setSelectedAssessment(data ?? null);
      setCurrentPage('take-test');
      return;
    }

    if (data) setUser({ ...data, isAuthenticated: true });

    const role = data?.role ?? user?.role;

    if (page === 'dashboard' && role) {
      setCurrentPage(ROLE_HOME[role] ?? 'dashboard');
    } else {
      setCurrentPage(page);
    }
  };

  const isAuthenticated = AUTHENTICATED_PAGES.includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      // Lecturer
      case 'dashboard':      return <DashboardPage onNavigate={handleNavigate} />;
      case 'assessments':    return <Assessments   onNavigate={handleNavigate} />;
      case 'grading':        return <GradingQueue  onNavigate={handleNavigate} />;
      case 'grading-detail': return <GradingDetail submission={selectedSubmission} onNavigate={handleNavigate} />;
      case 'analytics':      return <Analytics     onNavigate={handleNavigate} />;
      case 'settings':       return <Settings      onNavigate={handleNavigate} />;

      // Student
      case 'student-dashboard':   return <StudentDashboard   onNavigate={handleNavigate} />;
      case 'student-assessments': return <StudentAssessments onNavigate={handleNavigate} />;
      case 'student-analytics':   return <StudentAnalytics   onNavigate={handleNavigate} />;
      case 'take-test':           return <TakeTest           assessment={selectedAssessment} onNavigate={handleNavigate} />;
      case 'results':             return <Results            onNavigate={handleNavigate} />;
      case 'result-detail':       return <ResultDetail       submission={selectedResult}    onNavigate={handleNavigate} />;

      default: return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      <>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        {!showSplash && (
          <>
            {currentPage === 'landing'         && <LandingPage        onNavigate={handleNavigate} />}
            {currentPage === 'login'           && <LoginPage          onNavigate={handleNavigate} />}
            {currentPage === 'signup'          && <SignUpPage         onNavigate={handleNavigate} />}
            {currentPage === 'forgot-password' && <ForgotPasswordPage onNavigate={handleNavigate} />}
            {currentPage === 'reset-password'  && <ResetPasswordPage  onNavigate={handleNavigate} />}

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