// src/pages/lecturer/AnalyticsDashboard.tsx
// ✅ UPDATED: Using real API endpoint

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Download,
  Settings,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Users,
  Target,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  average_score: number;
  total_submissions: number;
  weak_topics: Array<{ topic: string; average_score: number }>;
  engagement_rate: number;
  score_distribution: Array<{ range: string; count: number }>;
  recent_assessments: Array<{
    title: string;
    subject: string;
    date: string;
    average_score: number;
    status: string;
  }>;
}

export default function AnalyticsDashboard() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get<AnalyticsData>(
          "/lecturer/analytics/dashboard",
        );
        console.log("✅ Analytics loaded:", data);
        setAnalytics(data);
      } catch (error) {
        console.error("❌ Failed to fetch analytics:", error);
        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: "Failed to load analytics",
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
      <DashboardLayout role="lecturer">
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
      <DashboardLayout role="lecturer">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lecturer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Performance Analytics
            </h1>
            <p className="text-muted-foreground">
              Data-driven insights for student assessments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="accent">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Average Score"
            value={`${analytics.average_score.toFixed(1)}%`}
            icon={Target}
            trend={{ value: 2.1, isPositive: true }}
          />
          <StatCard
            title="Total Submissions"
            value={analytics.total_submissions.toString()}
            subtitle="All assessments"
            icon={FileText}
          />
          <StatCard
            title="Weak Topics"
            value={analytics.weak_topics.length.toString()}
            subtitle="Need attention"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Engagement"
            value={`${analytics.engagement_rate}%`}
            icon={Users}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Score Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.score_distribution}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="range"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Weak Topics
            </h2>
            <div className="space-y-4">
              {analytics.weak_topics.map((topic, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {topic.topic}
                    </span>
                    <span className="text-sm font-semibold text-destructive">
                      {topic.average_score.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={topic.average_score}
                    max={100}
                    size="sm"
                    variant="destructive"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Assessments */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Recent Assessments
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                    TITLE
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                    SUBJECT
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                    DATE
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                    AVG SCORE
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent_assessments.map((assessment, index) => (
                  <tr
                    key={index}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {assessment.title}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {assessment.subject}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {assessment.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          assessment.average_score >= 70
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        {assessment.average_score.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          assessment.status === "Completed"
                            ? "success"
                            : "accent"
                        }
                      >
                        {assessment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
