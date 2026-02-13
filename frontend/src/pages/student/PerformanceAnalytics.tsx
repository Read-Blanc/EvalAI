// src/pages/student/PerformanceAnalytics.tsx
// ✅ COMPLETE FILE - Ready to use!

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Award, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface AnalyticsData {
  average_score: number;
  total_assessments: number;
  highest_score: number;
  lowest_score: number;
  subject_performance: Array<{
    subject: string;
    average_score: number;
    count: number;
  }>;
  recent_trend: Array<{
    date: string;
    score: number;
  }>;
}

export default function PerformanceAnalytics() {
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);

        const data = await apiClient.get<AnalyticsData>("/student/analytics");

        console.log("✅ Analytics loaded:", data);
        setAnalytics(data);
      } catch (error) {
        console.error("❌ Failed to fetch analytics:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: error.data?.detail || "Failed to load analytics",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout role="student">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your academic progress and identify areas for improvement
          </p>
        </div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <StatCard
            title="Average Score"
            value={`${analytics.average_score.toFixed(1)}%`}
            subtitle="Overall performance"
            icon={TrendingUp}
            variant="accent"
            trend={
              analytics.average_score >= 70
                ? { value: analytics.average_score, isPositive: true }
                : undefined
            }
          />
          <StatCard
            title="Total Assessments"
            value={analytics.total_assessments.toString()}
            subtitle="Completed"
            icon={Target}
          />
          <StatCard
            title="Highest Score"
            value={`${analytics.highest_score.toFixed(0)}%`}
            subtitle="Best performance"
            icon={Award}
            variant="success"
          />
          <StatCard
            title="Lowest Score"
            value={`${analytics.lowest_score.toFixed(0)}%`}
            subtitle="Needs improvement"
            icon={Calendar}
            variant="warning"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Performance by Subject */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Performance by Subject
              </h2>

              {analytics.subject_performance &&
              analytics.subject_performance.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.subject_performance}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="subject"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="average_score"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No subject data available
                </p>
              )}
            </Card>
          </div>

          {/* Subject Breakdown */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Subject Breakdown
              </h2>

              {analytics.subject_performance &&
              analytics.subject_performance.length > 0 ? (
                <div className="space-y-4">
                  {analytics.subject_performance.map((subject, index) => (
                    <motion.div
                      key={subject.subject}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {subject.subject}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {subject.count} tests
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          value={subject.average_score}
                          max={100}
                          size="sm"
                          variant={
                            subject.average_score >= 70
                              ? "success"
                              : subject.average_score >= 50
                                ? "accent"
                                : "destructive"
                          }
                          className="flex-1"
                        />
                        <span
                          className={`text-sm font-semibold ${
                            subject.average_score >= 70
                              ? "text-success"
                              : subject.average_score >= 50
                                ? "text-accent"
                                : "text-destructive"
                          }`}
                        >
                          {subject.average_score.toFixed(0)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No subjects available
                </p>
              )}
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
