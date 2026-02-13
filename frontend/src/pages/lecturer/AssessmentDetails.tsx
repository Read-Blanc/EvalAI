// src/pages/lecturer/AssessmentDetails.tsx
// ✅ NEW FILE: View assessment details with submissions

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  FileText,
  Clock,
  Download,
  BarChart3,
  Eye,
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

interface AssessmentDetails {
  id: number;
  title: string;
  description: string;
  subject: string;
  total_marks: number;
  duration_minutes: number;
  difficulty: string;
  is_active: boolean;
  created_at: string;
  questions: Array<{
    question_number: number;
    question_text: string;
    max_score: number;
  }>;
  submissions: Array<{
    submission_id: number;
    student_name: string;
    student_id: string;
    total_score: number;
    max_score: number;
    percentage: number;
    submitted_at: string;
    status: string;
  }>;
}

export default function AssessmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await apiClient.get<AssessmentDetails>(
          `/lecturer/assessments/${id}`,
        );
        console.log("✅ Assessment details loaded:", data);
        setAssessment(data);
      } catch (error) {
        console.error("❌ Failed to load assessment:", error);
        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: "Failed to load assessment details",
            variant: "destructive",
          });
        }
        navigate("/lecturer/assessments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;

    try {
      await apiClient.delete(`/lecturer/assessments/${id}`);
      toast({
        title: "Success",
        description: "Assessment deleted successfully",
      });
      navigate("/lecturer/assessments");
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: "Failed to delete assessment",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="lecturer">
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

  const avgScore =
    assessment.submissions.length > 0
      ? assessment.submissions.reduce((sum, s) => sum + s.percentage, 0) /
        assessment.submissions.length
      : 0;

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/lecturer/assessments">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {assessment.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {assessment.subject}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/lecturer/assessments/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold text-foreground">
                  {assessment.questions.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="text-2xl font-bold text-foreground">
                  {assessment.submissions.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {avgScore.toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold text-foreground">
                  {assessment.duration_minutes}m
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Questions
              </h2>
              <div className="space-y-3">
                {assessment.questions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Q{q.question_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {q.question_text}
                        </p>
                      </div>
                      <Badge variant="outline">{q.max_score} marks</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Submissions List */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Submissions
                </h2>
                <Badge variant="outline">{assessment.submissions.length}</Badge>
              </div>
              {assessment.submissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No submissions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {assessment.submissions.map((sub) => (
                    <Card key={sub.submission_id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">
                            {sub.student_name}
                          </p>
                          <Badge
                            variant={
                              sub.percentage >= 70 ? "success" : "accent"
                            }
                          >
                            {sub.percentage.toFixed(0)}%
                          </Badge>
                        </div>
                        <ProgressBar
                          value={sub.percentage}
                          max={100}
                          size="sm"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </span>
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              to={`/lecturer/submissions/${sub.submission_id}`}
                            >
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
