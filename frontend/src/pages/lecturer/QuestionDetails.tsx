import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  Clock,
  Users,
  Target,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
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
import { transformQuestion } from "@/services/apiTransformers";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface Question {
  id: string;
  text: string;
  modelAnswer: string;
  subject: string;
  courseCode: string;
  topic: string;
  difficulty: DifficultyLevel;
  maxScore: number;
  rubric?: Array<{
    id: string;
    criterion: string;
    description: string;
    weight: number;
    maxPoints: number;
  }>;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
}

interface QuestionStats {
  timesUsed: number;
  avgScore: number;
  lastUsed?: string;
  scoreDistribution?: Array<{ range: string; count: number }>;
}

export default function QuestionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch question details
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setIsLoading(true);

        // Fetch question data
        const data = await apiClient.get(`/lecturer/questions/${id}`);
        const transformedQuestion = transformQuestion(data);
        setQuestion(transformedQuestion);

        // Fetch question statistics (if endpoint exists)
        try {
          const statsData = await apiClient.get(
            `/lecturer/questions/${id}/stats`,
          );
          setStats(statsData as QuestionStats);
        } catch (statsError) {
          // Stats endpoint might not exist yet, use defaults
          setStats({
            timesUsed: 0,
            avgScore: 0,
          });
        }
      } catch (error) {
        console.error("❌ Failed to fetch question:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description:
              error.data?.detail || "Failed to load question details",
            variant: "destructive",
          });
        }
        navigate("/lecturer/questions");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchQuestion();
    }
  }, [id, navigate, toast]);

  const handleDuplicate = async () => {
    if (!question) return;

    try {
      // Create a duplicate question
      const duplicateData = {
        question_text: question.text,
        model_answer: question.modelAnswer,
        subject: question.subject,
        topic: question.topic,
        max_score: question.maxScore,
        difficulty: question.difficulty,
      };

      const newQuestion = (await apiClient.post(
        "/lecturer/questions",
        duplicateData,
      )) as { id: string };

      toast({
        title: "Question duplicated",
        description: "A copy has been created. Redirecting to edit...",
      });

      // Navigate to edit page for the new question
      navigate(`/lecturer/questions/${newQuestion.id}/edit`);
    } catch (error) {
      console.error("❌ Failed to duplicate question:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/lecturer/questions/${id}`);

      toast({
        title: "Question deleted",
        description: "The question has been removed from your bank.",
      });
      navigate("/lecturer/questions");
    } catch (error) {
      console.error("❌ Failed to delete question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout role="lecturer">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading question details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!question) {
    return (
      <DashboardLayout role="lecturer">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              Question not found
            </h3>
            <Button asChild>
              <Link to="/lecturer/questions">Back to Questions</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const avgPercentage =
    stats && stats.avgScore > 0
      ? (stats.avgScore / question.maxScore) * 100
      : 0;

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/lecturer/questions">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="muted">{question.courseCode}</Badge>
              <Badge
                variant={
                  question.difficulty === "beginner"
                    ? "success"
                    : question.difficulty === "intermediate"
                      ? "accent"
                      : "destructive"
                }
              >
                {question.difficulty}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Question Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(question.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/lecturer/questions/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <StatCard
              title="Times Used"
              value={stats.timesUsed.toString()}
              subtitle="In assessments"
              icon={Users}
              variant="accent"
            />
            <StatCard
              title="Average Score"
              value={
                stats.avgScore > 0
                  ? `${stats.avgScore.toFixed(1)}/${question.maxScore}`
                  : "N/A"
              }
              subtitle={
                stats.avgScore > 0
                  ? `${avgPercentage.toFixed(1)}%`
                  : "Not yet graded"
              }
              icon={Target}
            />
            <StatCard
              title="Max Possible"
              value={`${question.maxScore} marks`}
              icon={BarChart3}
            />
            <StatCard
              title="Last Used"
              value={stats.lastUsed || "Never"}
              subtitle={stats.lastUsed ? "In assessment" : "Not yet used"}
              icon={Clock}
            />
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Question Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Text */}
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Question</h2>
              <p className="text-foreground leading-relaxed">{question.text}</p>

              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-xs text-muted-foreground">Tags:</span>
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Model Answer */}
            <Card className="p-6 bg-accent/5 border-accent/20">
              <h2 className="font-semibold text-foreground mb-4">
                Model Answer (AI Reference)
              </h2>
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {question.modelAnswer}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                This answer is used by the AI grading system for semantic
                similarity comparison.
              </p>
            </Card>

            {/* Score Distribution */}
            {stats &&
              stats.scoreDistribution &&
              stats.scoreDistribution.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-semibold text-foreground mb-4">
                    Score Distribution
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.scoreDistribution}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="range"
                          className="text-xs fill-muted-foreground"
                        />
                        <YAxis className="text-xs fill-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Distribution of student scores across {stats.timesUsed}{" "}
                    attempts
                  </p>
                </Card>
              )}
          </div>

          {/* Right Column - Rubric & Info */}
          <div className="space-y-6">
            {/* Rubric Breakdown */}
            {question.rubric && question.rubric.length > 0 && (
              <Card className="p-6">
                <h2 className="font-semibold text-foreground mb-4">
                  Grading Rubric
                </h2>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {question.rubric.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={staggerItem}
                      className="space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {item.criterion}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm font-semibold text-foreground">
                            {item.maxPoints}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.weight}%
                          </p>
                        </div>
                      </div>
                      <ProgressBar
                        value={item.weight}
                        max={100}
                        size="sm"
                        variant="accent"
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            )}

            {/* Question Info */}
            <Card className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium text-foreground">
                    {question.subject}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Topic</span>
                  <span className="font-medium text-foreground">
                    {question.topic}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Course Code</span>
                  <Badge variant="muted">{question.courseCode}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <Badge
                    variant={
                      question.difficulty === "beginner"
                        ? "success"
                        : question.difficulty === "intermediate"
                          ? "accent"
                          : "destructive"
                    }
                  >
                    {question.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Score</span>
                  <span className="font-semibold text-foreground">
                    {question.maxScore} marks
                  </span>
                </div>
              </div>
            </Card>

            {/* Usage Warning (if question is used) */}
            {stats && stats.timesUsed > 0 && (
              <Card className="p-4 bg-warning/5 border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning mb-1 text-sm">
                      In Use
                    </h4>
                    <p className="text-xs text-warning/80">
                      This question has been used in {stats.timesUsed}{" "}
                      assessments. Editing may affect existing results.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Question</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this question? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {stats && stats.timesUsed > 0 && (
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Warning: This question has been used in {stats.timesUsed}{" "}
                  assessments.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Question"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
