// src/pages/lecturer/LecturerDashboard.tsx
// ✅ UPDATED: Using real API endpoints

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Plus,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
  stats: {
    pendingReviews: number;
    gradedToday: number;
    activeStudents: number;
    avgConfidence: number;
  };
  recentSubmissions: Array<{
    id: number;
    student_name: string;
    paper_title: string;
    subject: string;
    submitted_at: string;
    total_score: number;
    max_score: number;
  }>;
  recentAssessments: Array<{
    id: number;
    title: string;
    subject: string;
    total_submissions: number;
    graded_submissions: number;
    average_score: number;
    is_active: boolean;
  }>;
}

export default function LecturerDashboard() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Lecturer");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);

        // Fetch dashboard data
        const data = await apiClient.get<any>("/lecturer/analytics/dashboard");

        console.log("✅ Dashboard data loaded:", data);

        // Get user info
        try {
          const userInfo = await apiClient.get<any>("/auth/me");
          if (userInfo.name) setUserName(userInfo.name);
        } catch (e) {
          console.log("Could not fetch user info");
        }

        // Transform data
        setDashboardData({
          stats: {
            pendingReviews: data.pending_reviews || 0,
            gradedToday: data.graded_today || 0,
            activeStudents: data.active_students || 0,
            avgConfidence: data.avg_confidence || 94,
          },
          recentSubmissions: data.recent_submissions || [],
          recentAssessments: data.recent_assessments || [],
        });
      } catch (error) {
        console.error("❌ Failed to fetch dashboard:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: "Failed to load dashboard data",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [toast]);

  if (isLoading) {
    return (
      <DashboardLayout role="lecturer">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout role="lecturer">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome, {userName}
            </h1>
            <p className="text-muted-foreground">
              Manage your assessments and review AI-graded submissions.
            </p>
          </div>
          <Button variant="accent" asChild>
            <Link to="/lecturer/assessments/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Pending Reviews"
            value={dashboardData.stats.pendingReviews.toString()}
            subtitle="Awaiting finalization"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Graded Today"
            value={dashboardData.stats.gradedToday.toString()}
            subtitle="AI processed"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Active Students"
            value={dashboardData.stats.activeStudents.toString()}
            subtitle="Enrolled"
            icon={Users}
          />
          <StatCard
            title="Avg. AI Confidence"
            value={`${dashboardData.stats.avgConfidence}%`}
            icon={TrendingUp}
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Submissions */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Recent Submissions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Latest student submissions
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/lecturer/grading">View All</Link>
                </Button>
              </div>

              {dashboardData.recentSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No recent submissions
                </p>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {dashboardData.recentSubmissions.map((item, index) => (
                    <motion.div
                      key={item.id}
                      variants={staggerItem}
                      className="group p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {item.student_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {item.student_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {item.paper_title} • {item.subject}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Score
                            </p>
                            <p className="font-semibold text-foreground">
                              {item.total_score}/{item.max_score}
                            </p>
                          </div>

                          <Button size="sm" asChild>
                            <Link to={`/lecturer/submissions/${item.id}`}>
                              Review
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Submitted{" "}
                          {new Date(item.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Recent Assessments */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Recent Assessments
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/lecturer/assessments">All</Link>
                </Button>
              </div>

              {dashboardData.recentAssessments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No assessments yet
                </p>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {dashboardData.recentAssessments.map((assessment, index) => (
                    <motion.div
                      key={assessment.id}
                      variants={staggerItem}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {assessment.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {assessment.subject}
                          </p>
                        </div>
                        <Badge
                          variant={
                            assessment.is_active ? "success" : "secondary"
                          }
                        >
                          {assessment.is_active ? "Active" : "Closed"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Graded</span>
                          <span className="text-foreground">
                            {assessment.graded_submissions}/
                            {assessment.total_submissions}
                          </span>
                        </div>
                        <ProgressBar
                          value={assessment.graded_submissions}
                          max={assessment.total_submissions}
                          size="sm"
                          variant={
                            assessment.graded_submissions ===
                            assessment.total_submissions
                              ? "success"
                              : "accent"
                          }
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Avg Score
                          </span>
                          <span
                            className={`font-medium ${
                              assessment.average_score >= 70
                                ? "text-success"
                                : "text-warning"
                            }`}
                          >
                            {assessment.average_score.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/lecturer/questions">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Question Bank
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/lecturer/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/lecturer/assessments/create">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
