import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Signup from "@/pages/SignUp";
import StudentDashboard from "./pages/student/StudentDashboard";
import AssessmentSubmission from "./pages/student/AssessmentSubmission";
import StudentResults from "./pages/student/StudentResults";
import StudentSettings from "./pages/student/StudentSettings";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import QuestionBank from "./pages/lecturer/QuestionBank";
import AnalyticsDashboard from "./pages/lecturer/AnalyticsDashboard";
import GradingDashboard from "./pages/lecturer/GradingDashboard";
import CreateAssessment from "./pages/lecturer/CreateAssessment";
import LecturerSettings from "./pages/lecturer/Settings";
import NotFound from "./pages/NotFound";
import AvailableAssessment from "./pages/student/AvailableAssessment";
import ManageAssessment from "./pages/lecturer/ManageAssessment";
import EditQuestion from "./pages/lecturer/EditQuestion";
import QuestionDetails from "./pages/lecturer/QuestionDetails";
import CreateQuestion from "./pages/lecturer/CreateQuestion";
import PerformanceAnalytics from "./pages/student/PerformanceAnalytics";
import ResultDetail from "./pages/student/ResultDetail";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            {/* Student Routes - Protected */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assessment/:id"
              element={
                <ProtectedRoute requiredRole="student">
                  <AssessmentSubmission />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results/:id"
              element={
                <ProtectedRoute requiredRole="student">
                  <ResultDetail />{" "}
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/performance"
              element={
                <ProtectedRoute requiredRole="student">
                  <PerformanceAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/analytics"
              element={<Navigate to="/student/performance" replace />}
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assessments"
              element={
                <ProtectedRoute requiredRole="student">
                  <AvailableAssessment /> {/* ✅ NEW */}
                </ProtectedRoute>
              }
            />
            {/* Lecturer Routes - Protected */}
            <Route
              path="/lecturer/dashboard"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/questions"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <QuestionBank />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/assessments/create"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <CreateAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/analytics"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/grading"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <GradingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/grading/:id"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <GradingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/settings"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <LecturerSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/questions"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <QuestionBank /> {/* YOU ALREADY HAVE THIS */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/questions/new"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <CreateQuestion /> {/* ✅ NEW */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/questions/:id"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <QuestionDetails /> {/* ✅ NEW */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/questions/:id/edit"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <EditQuestion /> {/* ✅ NEW */}
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/assessments"
              element={
                <ProtectedRoute requiredRole="lecturer">
                  <ManageAssessment /> {/* ✅ NEW */}
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
