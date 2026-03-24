import React, { useState, useEffect } from "react";

import { UserContext } from "./UserContext";
import { supabase } from "./supabaseClient";

import SplashScreen from "./SplashScreen";
import AppLayout from "./AppLayout";
import RoleSelectPage from "./RoleSelectPage";

import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import ResetPasswordPage from "./ResetPasswordPage";

import DashboardPage from "./lecturer/DashboardPage";
import Assessments from "./lecturer/Assessments";
import GradingQueue from "./lecturer/GradingQueue";
import GradingDetail from "./lecturer/GradingDetail";
import Analytics from "./lecturer/Analytics";
import Settings from "./Settings";

import StudentDashboard from "./student/Dashboard";
import StudentAssessments from "./student/StudentAssessments";
import StudentAnalytics from "./student/Analytics";
import TakeTest from "./student/TakeTest";
import Results from "./student/Results";
import ResultDetail from "./student/ResultDetail";

import "./App.css";

const AUTHENTICATED_PAGES = [
  "dashboard",
  "assessments",
  "grading",
  "grading-detail",
  "analytics",
  "settings",
  "student-dashboard",
  "student-assessments",
  "student-analytics",
  "take-test",
  "results",
  "result-detail",
];

const ROLE_HOME = {
  lecturer: "dashboard",
  student: "student-dashboard",
};

function SessionLoader() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #e0e0e0",
          borderTopColor: "#1a1a1a",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        hydrateUserFromSession(session).finally(() => setSessionChecked(true));
      } else {
        setSessionChecked(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setCurrentPage("reset-password");
        return;
      }
      if (session) {
        hydrateUserFromSession(session);
      } else {
        setUser(null);
        setCurrentPage("landing");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const hydrateUserFromSession = async (session) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .single();

    const role = profile?.role ?? session.user.user_metadata?.role ?? null;
    const fullName =
      profile?.full_name ??
      session.user.user_metadata?.full_name ??
      session.user.user_metadata?.name ?? // Google sets 'name'
      "";

    const hydrated = {
      id: session.user.id,
      email: session.user.email,
      fullName,
      role,
      isAuthenticated: true,
    };

    setUser(hydrated);

    if (!role) {
      // Google OAuth user — no role yet, send to role selection
      setCurrentPage("select-role");
    } else {
      setCurrentPage((prev) =>
        [
          "landing",
          "login",
          "signup",
          "forgot-password",
          "select-role",
        ].includes(prev)
          ? (ROLE_HOME[role] ?? "dashboard")
          : prev,
      );
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage("landing");
  };

  const handleNavigate = (page, data) => {
    if (page === "grading-detail") {
      setSelectedSubmission(data ?? null);
      setCurrentPage("grading-detail");
      return;
    }
    if (page === "result-detail") {
      setSelectedResult(data ?? null);
      setCurrentPage("result-detail");
      return;
    }
    if (page === "take-test") {
      setSelectedAssessment(data ?? null);
      setCurrentPage("take-test");
      return;
    }

    if (data) setUser((prev) => ({ ...prev, ...data, isAuthenticated: true }));

    const role = data?.role ?? user?.role;

    if (page === "dashboard" && role) {
      setCurrentPage(ROLE_HOME[role] ?? "dashboard");
    } else {
      setCurrentPage(page);
    }
  };

  const isAuthenticated = AUTHENTICATED_PAGES.includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={handleNavigate} />;
      case "assessments":
        return <Assessments onNavigate={handleNavigate} />;
      case "grading":
        return <GradingQueue onNavigate={handleNavigate} />;
      case "grading-detail":
        return (
          <GradingDetail
            submission={selectedSubmission}
            onNavigate={handleNavigate}
          />
        );
      case "analytics":
        return <Analytics onNavigate={handleNavigate} />;
      case "settings":
        return <Settings onNavigate={handleNavigate} />;
      case "student-dashboard":
        return <StudentDashboard onNavigate={handleNavigate} />;
      case "student-assessments":
        return <StudentAssessments onNavigate={handleNavigate} />;
      case "student-analytics":
        return <StudentAnalytics onNavigate={handleNavigate} />;
      case "take-test":
        return (
          <TakeTest
            assessment={selectedAssessment}
            onNavigate={handleNavigate}
          />
        );
      case "results":
        return <Results onNavigate={handleNavigate} />;
      case "result-detail":
        return (
          <ResultDetail
            submission={selectedResult}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  if (!sessionChecked) return <SessionLoader />;

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      <>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        {!showSplash && (
          <>
            {/* Public pages */}
            {currentPage === "landing" && (
              <LandingPage onNavigate={handleNavigate} />
            )}
            {currentPage === "login" && (
              <LoginPage onNavigate={handleNavigate} />
            )}
            {currentPage === "signup" && (
              <SignUpPage onNavigate={handleNavigate} />
            )}
            {currentPage === "forgot-password" && (
              <ForgotPasswordPage onNavigate={handleNavigate} />
            )}
            {currentPage === "reset-password" && (
              <ResetPasswordPage onNavigate={handleNavigate} />
            )}

            {/* Role selection — Google OAuth new users */}
            {currentPage === "select-role" && (
              <RoleSelectPage onNavigate={handleNavigate} />
            )}

            {/* Authenticated app */}
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
