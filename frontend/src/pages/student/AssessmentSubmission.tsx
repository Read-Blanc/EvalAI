// src/pages/student/AssessmentSubmission.tsx
// ✅ COMPLETE FILE - Using real API!

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Clock, Save, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

interface Question {
  question_number: number;
  question_text: string;
  max_score: number;
}

interface AssessmentData {
  id: number;
  title: string;
  description: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  questions: Question[];
}

interface SubmissionResponse {
  submission_id: number;
}

export default function AssessmentSubmission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load assessment
  useEffect(() => {
    const loadAssessment = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        const data = await apiClient.get<AssessmentData>(
          `/student/assessments/${id}`,
        );

        console.log("✅ Assessment loaded:", data);
        setAssessment(data);
        setTimeRemaining(data.duration_minutes * 60);
      } catch (error) {
        console.error("❌ Failed to load assessment:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: "Failed to load assessment",
            variant: "destructive",
          });
        }
        navigate("/student/assessments");
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();
  }, [id, navigate, toast]);

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    // Confirm submission
    if (
      !confirm(
        "Are you sure you want to submit? You cannot change answers after submission.",
      )
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        answers: assessment.questions.map((q) => ({
          question_number: q.question_number,
          answer: answers[q.question_number] || "",
        })),
      };

      const result = await apiClient.post<SubmissionResponse>(
        `/student/assessments/${id}/submit`,
        submissionData,
      );

      console.log("✅ Submission successful:", result);

      toast({
        title: "Submitted Successfully!",
        description: "Your assessment has been submitted for grading.",
      });

      navigate(`/student/results/${result.submission_id}`);
    } catch (error) {
      console.error("❌ Submission failed:", error);

      if (error instanceof ApiError) {
        toast({
          title: "Submission Failed",
          description: error.data?.detail || "Failed to submit assessment",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionsAttempted = assessment
    ? Object.keys(answers).filter((k) => answers[parseInt(k)]?.trim()).length
    : 0;

  const isLowTime = timeRemaining < 600;

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!assessment) return null;

  return (
    <DashboardLayout role="student">
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/student/assessments" className="hover:text-foreground">
                Assessments
              </Link>
              <span>/</span>
              <span className="text-foreground">{assessment.title}</span>
            </div>

            <Badge
              variant={isLowTime ? "destructive" : "success"}
              className={`font-mono text-base px-3 py-1 ${isLowTime ? "animate-pulse" : ""}`}
            >
              <Clock className="h-4 w-4 mr-1.5" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {assessment.title}
              </h1>
              <p className="text-muted-foreground mb-6">
                {assessment.description || "Answer all questions"}
              </p>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Progress: {questionsAttempted} of{" "}
                    {assessment.questions.length} attempted
                  </span>
                  <span className="text-muted-foreground">
                    Total Marks: {assessment.total_marks}
                  </span>
                </div>
                <ProgressBar
                  value={questionsAttempted}
                  max={assessment.questions.length}
                  variant="accent"
                />
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {assessment.questions.map((question, index) => (
                  <motion.div
                    key={question.question_number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          Q{question.question_number}. {question.question_text}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="ml-4 whitespace-nowrap"
                      >
                        {question.max_score} marks
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Your answer
                      </label>
                      <Textarea
                        placeholder="Type your answer here..."
                        value={answers[question.question_number] || ""}
                        onChange={(e) =>
                          setAnswers({
                            ...answers,
                            [question.question_number]: e.target.value,
                          })
                        }
                        className="min-h-[150px] resize-y"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {answers[question.question_number]
                            ?.split(" ")
                            .filter(Boolean).length || 0}{" "}
                          words
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <Button
              variant="accent"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || questionsAttempted === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
