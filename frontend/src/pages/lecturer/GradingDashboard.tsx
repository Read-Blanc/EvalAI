// src/pages/lecturer/GradingDashboard.tsx
// ✅ NEW FILE: Grading dashboard for reviewing submissions

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Flag,
  Save,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

interface SubmissionData {
  submission_id: number;
  student_name: string;
  student_id: string;
  paper_title: string;
  subject: string;
  submitted_at: string;
  total_score: number;
  max_score: number;
  percentage: number;
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

export default function GradingDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [manualScores, setManualScores] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSubmission = async () => {
      if (!id) {
        navigate("/lecturer/grading");
        return;
      }

      try {
        setIsLoading(true);

        const data = await apiClient.get<SubmissionData>(
          `/lecturer/submissions/${id}`,
        );

        console.log("✅ Submission loaded:", data);
        setSubmission(data);

        // Initialize manual scores with AI scores
        const initialScores: Record<number, number> = {};
        const initialFeedback: Record<number, string> = {};
        data.question_results.forEach((q) => {
          initialScores[q.question_number] = q.score;
          initialFeedback[q.question_number] = q.feedback || "";
        });
        setManualScores(initialScores);
        setFeedback(initialFeedback);
      } catch (error) {
        console.error("❌ Failed to load submission:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: "Failed to load submission",
            variant: "destructive",
          });
        }
        navigate("/lecturer/grading");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmission();
  }, [id, navigate, toast]);

  const handleSaveGrade = async () => {
    if (!submission) return;

    setIsSaving(true);

    try {
      const updates = submission.question_results.map((q) => ({
        question_number: q.question_number,
        score: manualScores[q.question_number] || q.score,
        feedback: feedback[q.question_number] || q.feedback || "",
      }));

      await apiClient.post(`/lecturer/submissions/${id}/grade`, {
        question_grades: updates,
      });

      toast({
        title: "Grade Saved",
        description: "Submission grade has been updated successfully.",
      });

      navigate("/lecturer/grading");
    } catch (error) {
      console.error("❌ Failed to save grade:", error);

      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.data?.detail || "Failed to save grade",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (
      submission &&
      currentQuestionIndex < submission.question_results.length - 1
    ) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="lecturer">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading submission...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!submission) return null;

  const currentQuestion = submission.question_results[currentQuestionIndex];
  const totalScore = Object.values(manualScores).reduce(
    (sum, score) => sum + score,
    0,
  );
  const totalPercentage = (totalScore / submission.max_score) * 100;

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3 mb-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/lecturer/grading">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h2 className="font-semibold text-foreground">
                  {submission.student_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {submission.paper_title} • {submission.subject}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} of{" "}
                {submission.question_results.length}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={
                  currentQuestionIndex ===
                  submission.question_results.length - 1
                }
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Question & Answer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary">
                  Question {currentQuestion.question_number}
                </Badge>
                <Badge variant="outline">
                  {currentQuestion.max_score} marks
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-4">
                {currentQuestion.question_text}
              </h3>
            </Card>

            {/* Student Answer */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Student Answer
              </h3>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {currentQuestion.student_answer}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Word count: {currentQuestion.student_answer.split(" ").length}
                </p>
              </div>
            </Card>

            {/* Feedback */}
            <Card className="p-6">
              <Label
                htmlFor="feedback"
                className="text-base font-semibold mb-2"
              >
                Feedback for Student
              </Label>
              <Textarea
                id="feedback"
                value={feedback[currentQuestion.question_number] || ""}
                onChange={(e) =>
                  setFeedback({
                    ...feedback,
                    [currentQuestion.question_number]: e.target.value,
                  })
                }
                className="mt-2 min-h-[120px]"
                placeholder="Provide constructive feedback..."
              />
            </Card>
          </div>

          {/* Right: Scoring */}
          <div className="space-y-6">
            {/* AI Score */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  AI Suggested Score
                </h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {currentQuestion.score}/{currentQuestion.max_score}
                </div>
                <p className="text-sm text-muted-foreground">
                  {(
                    (currentQuestion.score / currentQuestion.max_score) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
            </Card>

            {/* Manual Score Override */}
            <Card className="p-6">
              <Label
                htmlFor="manualScore"
                className="text-base font-semibold mb-2"
              >
                Your Score
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="manualScore"
                  type="number"
                  min="0"
                  max={currentQuestion.max_score}
                  value={manualScores[currentQuestion.question_number] || 0}
                  onChange={(e) =>
                    setManualScores({
                      ...manualScores,
                      [currentQuestion.question_number]:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                  className="text-lg font-semibold"
                />
                <span className="text-muted-foreground">
                  / {currentQuestion.max_score}
                </span>
              </div>
              <ProgressBar
                value={manualScores[currentQuestion.question_number] || 0}
                max={currentQuestion.max_score}
                className="mt-4"
                variant={
                  ((manualScores[currentQuestion.question_number] || 0) /
                    currentQuestion.max_score) *
                    100 >=
                  70
                    ? "success"
                    : "accent"
                }
              />
            </Card>

            {/* Total Score */}
            <Card className="p-6 bg-primary/5">
              <h3 className="font-semibold text-foreground mb-4">
                Total Score
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {totalScore.toFixed(1)}/{submission.max_score}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalPercentage.toFixed(1)}%
                </p>
                <ProgressBar
                  value={totalPercentage}
                  max={100}
                  variant="accent"
                />
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="accent"
                onClick={handleSaveGrade}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finalize Grade
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full">
                <Flag className="h-4 w-4 mr-2" />
                Flag for Review
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
