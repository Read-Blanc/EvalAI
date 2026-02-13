// src/pages/student/StudentDashboard.tsx
// ✅ FIXED: Using correct endpoint /student/dashboard instead of /analytics/my-dashboard

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  FileText,
  ArrowRight,
  Calendar,
  Target,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";
import getErrorMessage from "@/services/apiClient";
import { useToast } from "@/hooks/use-toast";

// Types
interface DashboardStats {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  highestScore: number;
  upcomingCount: number;
}

interface RecentResult {
  id: string;
  assessmentTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  subject: string;
}

interface UpcomingAssessment {
  id: number;
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  difficulty: string;
}

interface DashboardData {
  user_info: {
    username: string;
    email: string;
    fullName: string;
    studentId: string;
  };
  statistics?: any;
  stats: DashboardStats;
  recentResults: RecentResult[];
  upcomingAssessments: UpcomingAssessment[];
  userInfo?: {
    username: string;
    email: string;
    fullName: string;
    studentId: string;
  };
}

export default function StudentDashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user_info: {
      username: "",
      email: "",
      fullName: "",
      studentId: "",
    },
    stats: {
      totalAssessments: 0,
      completedAssessments: 0,
      averageScore: 0,
      highestScore: 0,
      upcomingCount: 0,
    },
    recentResults: [],
    upcomingAssessments: [],
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);

        // ✅ CORRECT: Use /student/dashboard endpoint
        const data = await apiClient.get<DashboardData>("/student/dashboard");

        console.log("✅ Dashboard data loaded:", data);

        // Transform the data from backend format
        setDashboardData({
          user_info: data.user_info || {
            username: "",
            email: "",
            fullName: "",
            studentId: "",
          },
          statistics: data.statistics,
          stats: {
            totalAssessments: data.statistics?.total_assessments || 0,
            completedAssessments: data.statistics?.total_assessments || 0,
            averageScore: data.statistics?.average_score || 0,
            highestScore:
              data.statistics?.assessments?.reduce(
                (max: number, a: any) => Math.max(max, a.percentage || 0),
                0,
              ) || 0,
            upcomingCount: 0, // Will be set from upcomingAssessments
          },
          recentResults:
            data.statistics?.assessments?.slice(0, 3).map((a: any) => ({
              id: a.submission_id?.toString() || a.paper_id?.toString() || "0",
              assessmentTitle: a.paper_title || "Unknown Assessment",
              score: a.total_score || 0,
              maxScore: a.max_score || 100,
              percentage: a.percentage || 0,
              submittedAt: a.submitted_at || new Date().toISOString(),
              subject: a.subject || "General",
            })) || [],
          upcomingAssessments: [],
          userInfo: data.user_info,
        });

        // Fetch upcoming assessments separately
        try {
          const assessments = await apiClient.get<UpcomingAssessment[]>(
            "/student/assessments",
          );
          const upcoming = assessments.slice(0, 3);

          setDashboardData((prev) => ({
            ...prev,
            upcomingAssessments: upcoming,
            stats: {
              ...prev.stats,
              upcomingCount: assessments.length,
            },
          }));
        } catch (error) {
          console.warn("Could not fetch upcoming assessments:", error);
        }
      } catch (error) {
        console.error("❌ Failed to fetch dashboard:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error Loading Dashboard",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Error",
            description:
              "Could not connect to server. Please check if the backend is running.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [toast]);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, recentResults, upcomingAssessments, userInfo } = dashboardData;

  return (
    <DashboardLayout role="student">
      <motion.div {...fadeInUp} className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back
            {userInfo?.fullName ? `, ${userInfo.fullName.split(" ")[0]}` : ""}!
            👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your academic performance
          </p>
        </div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Assessments"
            value={stats.totalAssessments.toString()}
            subtitle="Completed"
            icon={BookOpen}
            trend={
              stats.totalAssessments > 0
                ? { value: stats.totalAssessments, isPositive: true }
                : undefined
            }
          />
          <StatCard
            title="Average Score"
            value={`${stats.averageScore.toFixed(1)}%`}
            subtitle="Overall performance"
            icon={TrendingUp}
            variant="accent"
            trend={
              stats.averageScore >= 70
                ? { value: stats.averageScore, isPositive: true }
                : stats.averageScore >= 50
                  ? undefined
                  : { value: stats.averageScore, isPositive: false }
            }
          />
          <StatCard
            title="Highest Score"
            value={`${stats.highestScore.toFixed(0)}%`}
            subtitle="Best performance"
            icon={Award}
            variant="success"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingCount.toString()}
            subtitle="Available assessments"
            icon={Calendar}
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Results */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Recent Results
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/student/results">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {recentResults.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  No results yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your first assessment to see your results here
                </p>
                <Button asChild>
                  <Link to="/student/assessments">Browse Assessments</Link>
                </Button>
              </Card>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {recentResults.map((result) => (
                  <motion.div key={result.id} variants={staggerItem}>
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {result.assessmentTitle}
                            </h3>
                            <Badge variant="outline">{result.subject}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Submitted{" "}
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">
                                  Score
                                </span>
                                <span className="font-semibold text-foreground">
                                  {result.score}/{result.maxScore}
                                </span>
                              </div>
                              <ProgressBar
                                value={result.percentage}
                                max={100}
                                variant={
                                  result.percentage >= 70
                                    ? "success"
                                    : result.percentage >= 50
                                      ? "accent"
                                      : "destructive"
                                }
                              />
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-2xl font-bold ${
                                  result.percentage >= 70
                                    ? "text-success"
                                    : result.percentage >= 50
                                      ? "text-accent"
                                      : "text-destructive"
                                }`}
                              >
                                {result.percentage.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/student/results/${result.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Upcoming Assessments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Upcoming
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/student/assessments">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {upcomingAssessments.length === 0 ? (
              <Card className="p-6 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No upcoming assessments
                </p>
              </Card>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {upcomingAssessments.map((assessment) => (
                  <motion.div key={assessment.id} variants={staggerItem}>
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {assessment.subject}
                            </Badge>
                            <Badge
                              variant={
                                assessment.difficulty === "beginner"
                                  ? "success"
                                  : assessment.difficulty === "intermediate"
                                    ? "accent"
                                    : "warning"
                              }
                            >
                              {assessment.difficulty}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {assessment.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {assessment.durationMinutes}m
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" />
                            {assessment.totalMarks} marks
                          </div>
                        </div>

                        <Button size="sm" className="w-full" asChild>
                          <Link to={`/student/assessment/${assessment.id}`}>
                            Start Assessment
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link to="/student/assessments">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  <span>Browse Assessments</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link to="/student/results">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>View Results</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link to="/student/performance">
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Performance Analytics</span>
                </div>
              </Link>
            </Button>
          </div>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
