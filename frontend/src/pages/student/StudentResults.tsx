// src/pages/student/StudentResults.tsx
// ✅ COMPLETE FILE - Ready to use!

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, CheckCircle2, Clock, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

interface Submission {
  submission_id: number;
  paper_title: string;
  subject: string;
  total_score: number;
  max_score: number;
  percentage: number;
  submitted_at: string;
  status: string;
}

export default function StudentResults() {
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);

        const data = await apiClient.get<Submission[]>("/student/submissions");

        console.log("✅ Submissions loaded:", data);
        setSubmissions(data);
      } catch (error) {
        console.error("❌ Failed to fetch submissions:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: error.data?.detail || "Failed to load submissions",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [toast]);

  const filteredSubmissions = submissions.filter(
    (sub) =>
      sub.paper_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading results...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Results
          </h1>
          <p className="text-muted-foreground">
            View all your assessment submissions ({filteredSubmissions.length}{" "}
            total)
          </p>
        </div>

        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search results..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {filteredSubmissions.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              No results yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete your first assessment to see results here
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
            className="space-y-4"
          >
            {filteredSubmissions.map((submission, index) => (
              <motion.div key={submission.submission_id} variants={staggerItem}>
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{submission.subject}</Badge>
                        <Badge variant="success">Graded</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {submission.paper_title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Submitted{" "}
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Score</span>
                            <span className="font-semibold">
                              {submission.total_score}/{submission.max_score}
                            </span>
                          </div>
                          <ProgressBar
                            value={submission.percentage}
                            max={100}
                            variant={
                              submission.percentage >= 70
                                ? "success"
                                : submission.percentage >= 50
                                  ? "accent"
                                  : "destructive"
                            }
                          />
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            submission.percentage >= 70
                              ? "text-success"
                              : submission.percentage >= 50
                                ? "text-accent"
                                : "text-destructive"
                          }`}
                        >
                          {submission.percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <Button asChild>
                      <Link to={`/student/results/${submission.submission_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
