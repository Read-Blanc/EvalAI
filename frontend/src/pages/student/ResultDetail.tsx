// src/pages/student/ResultDetail.tsx
// ✅ COMPLETE FILE - Ready to use!

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

interface SubmissionData {
  submission_id: number;
  paper_title: string;
  subject: string;
  total_score: number;
  max_score: number;
  percentage: number;
  submitted_at: string;
  avg_similarity?: number;
  student_name?: string;
  student_id?: string;
  question_results: Array<{
    question_number: number;
    question_text: string;
    student_answer: string;
    score: number;
    max_score: number;
    feedback?: string;
    rubric_scores?: Record<string, any>;
  }>;
}

export default function ResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubmission = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "No submission ID provided.",
          variant: "destructive",
        });
        navigate("/student/results");
        return;
      }

      try {
        setIsLoading(true);

        const data = await apiClient.get<SubmissionData>(
          `/student/submissions/${id}`,
        );

        console.log("✅ Submission loaded:", data);
        setSubmission(data);
      } catch (error) {
        console.error("❌ Failed to load submission:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description:
              error.data?.detail || "Failed to load submission details",
            variant: "destructive",
          });
        }
        navigate("/student/results");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmission();
  }, [id, navigate, toast]);

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Very Good";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Satisfactory";
    return "Needs Improvement";
  };

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

  if (!submission) return null;

  return (
    <DashboardLayout role="student">
      <motion.div {...fadeInUp} className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/student/results">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Assessment Results
              </h1>
              <p className="text-sm text-muted-foreground">
                {submission.paper_title}
              </p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Overview Card */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-border">
              <div
                className={`text-5xl font-bold mb-2 ${
                  submission.percentage >= 70
                    ? "text-success"
                    : submission.percentage >= 50
                      ? "text-accent"
                      : "text-destructive"
                }`}
              >
                {submission.percentage.toFixed(0)}%
              </div>
              <Badge
                variant={
                  submission.percentage >= 70
                    ? "success"
                    : submission.percentage >= 50
                      ? "accent"
                      : "destructive"
                }
              >
                {getGradeLabel(submission.percentage)}
              </Badge>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Score
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {submission.total_score}/{submission.max_score}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subject</p>
                <Badge variant="outline">{submission.subject}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  AI Similarity
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {((submission.avg_similarity || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Questions Breakdown */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {submission.question_results.map((question, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        Question {question.question_number}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">
                        {question.score}/{question.max_score} points
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {question.question_text}
                    </h3>
                  </div>
                  <div className="text-right">
                    <ProgressBar
                      value={(question.score / question.max_score) * 100}
                      max={100}
                      variant={
                        (question.score / question.max_score) * 100 >= 70
                          ? "success"
                          : (question.score / question.max_score) * 100 >= 50
                            ? "accent"
                            : "destructive"
                      }
                      className="w-32 mb-2"
                    />
                    <span
                      className={`text-2xl font-bold ${
                        (question.score / question.max_score) * 100 >= 70
                          ? "text-success"
                          : (question.score / question.max_score) * 100 >= 50
                            ? "text-accent"
                            : "text-destructive"
                      }`}
                    >
                      {((question.score / question.max_score) * 100).toFixed(0)}
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Your Answer
                    </h4>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {question.student_answer}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Word count: {question.student_answer.split(" ").length}
                      </p>
                    </div>
                  </div>

                  {question.feedback && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Feedback
                      </h4>
                      <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                        <p className="text-sm text-foreground">
                          {question.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {question.rubric_scores &&
                    Object.keys(question.rubric_scores).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          Rubric Breakdown
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(question.rubric_scores).map(
                            ([criterion, data]: [string, any]) => (
                              <div
                                key={criterion}
                                className="flex items-center gap-3"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-foreground capitalize">
                                      {criterion.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {data.score || 0}/{data.max_score || 5}
                                    </span>
                                  </div>
                                  <ProgressBar
                                    value={
                                      ((data.score || 0) /
                                        (data.max_score || 5)) *
                                      100
                                    }
                                    max={100}
                                    size="sm"
                                    variant={
                                      ((data.score || 0) /
                                        (data.max_score || 5)) *
                                        100 >=
                                      70
                                        ? "success"
                                        : ((data.score || 0) /
                                              (data.max_score || 5)) *
                                              100 >=
                                            50
                                          ? "accent"
                                          : "destructive"
                                    }
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/student/results">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
