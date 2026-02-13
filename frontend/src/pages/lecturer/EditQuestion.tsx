// src/pages/lecturer/EditQuestion.tsx
// ✅ FIXED: Complete API integration with proper state management

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";
import {
  transformQuestion,
  transformApiError,
} from "@/services/apiTransformers";

// Types
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface RubricItem {
  id: string;
  criterion: string;
  description: string;
  weight: number;
  maxPoints: number;
}

interface QuestionFormData {
  text: string;
  modelAnswer: string;
  subject: string;
  courseCode: string;
  topic: string;
  difficulty: DifficultyLevel;
  maxScore: number;
  rubric: RubricItem[];
  timesUsed?: number;
}

export default function EditQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<QuestionFormData>({
    text: "",
    modelAnswer: "",
    subject: "",
    courseCode: "",
    topic: "",
    difficulty: "intermediate",
    maxScore: 10,
    rubric: [
      {
        id: `rubric-${Date.now()}`,
        criterion: "",
        description: "",
        weight: 100,
        maxPoints: 10,
      },
    ],
  });

  // Fetch question data on mount
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setIsLoading(true);

        const data = await apiClient.get(`/lecturer/questions/${id}`);
        const transformed = transformQuestion(data);

        // Map transformed data to form data structure
        setQuestion({
          text: transformed.text,
          modelAnswer: transformed.modelAnswer,
          subject: transformed.subject,
          courseCode: transformed.courseCode,
          topic: transformed.topic,
          difficulty: transformed.difficulty as DifficultyLevel,
          maxScore: transformed.maxScore,
          rubric:
            transformed.rubric && transformed.rubric.length > 0
              ? transformed.rubric
              : [
                  {
                    id: `rubric-${Date.now()}`,
                    criterion: "",
                    description: "",
                    weight: 100,
                    maxPoints: transformed.maxScore,
                  },
                ],
          timesUsed: 0, // Would come from stats endpoint
        });
      } catch (error) {
        console.error("❌ Failed to fetch question:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: transformApiError(error),
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

  // Update field helper
  const updateField = <K extends keyof QuestionFormData>(
    field: K,
    value: QuestionFormData[K],
  ) => {
    setQuestion((prev) => ({ ...prev, [field]: value }));
  };

  // Update rubric item
  const updateRubricItem = (
    index: number,
    field: keyof RubricItem,
    value: any,
  ) => {
    const newRubric = [...question.rubric];
    newRubric[index] = { ...newRubric[index], [field]: value };
    updateField("rubric", newRubric);
  };

  // Add rubric item
  const addRubricItem = () => {
    const newItem: RubricItem = {
      id: `rubric-${Date.now()}`,
      criterion: "",
      description: "",
      weight: 0,
      maxPoints: 0,
    };
    updateField("rubric", [...question.rubric, newItem]);
  };

  // Remove rubric item
  const removeRubricItem = (index: number) => {
    if (question.rubric.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one rubric criterion.",
        variant: "destructive",
      });
      return;
    }
    const newRubric = question.rubric.filter((_, i) => i !== index);
    updateField("rubric", newRubric);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!question.text.trim()) {
      toast({
        title: "Missing question text",
        description: "Please enter the question text.",
        variant: "destructive",
      });
      return;
    }

    if (!question.modelAnswer.trim()) {
      toast({
        title: "Missing model answer",
        description: "Please provide a model answer.",
        variant: "destructive",
      });
      return;
    }

    // Validate rubric totals
    const totalWeight = question.rubric.reduce(
      (sum, item) => sum + item.weight,
      0,
    );
    const totalPoints = question.rubric.reduce(
      (sum, item) => sum + item.maxPoints,
      0,
    );

    if (totalWeight !== 100) {
      toast({
        title: "Invalid rubric",
        description: "Rubric weights must sum to 100%.",
        variant: "destructive",
      });
      return;
    }

    if (totalPoints !== question.maxScore) {
      toast({
        title: "Invalid rubric",
        description: `Rubric points (${totalPoints}) must equal max score (${question.maxScore}).`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform to backend format
      const backendData = {
        question_text: question.text,
        model_answer: question.modelAnswer,
        subject: question.subject,
        topic: question.topic,
        max_score: question.maxScore,
        difficulty: question.difficulty,
        rubric_criteria: question.rubric.map((item) => ({
          name: item.criterion,
          description: item.description,
          weight: item.weight,
          max_points: item.maxPoints,
        })),
      };

      await apiClient.put(`/lecturer/questions/${id}`, backendData);

      toast({
        title: "Question updated!",
        description: "Your changes have been saved successfully.",
      });

      navigate(`/lecturer/questions/${id}`);
    } catch (error) {
      console.error("❌ Failed to update question:", error);

      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: transformApiError(error),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update question. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const totalWeight = question.rubric.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  const totalPoints = question.rubric.reduce(
    (sum, item) => sum + item.maxPoints,
    0,
  );

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout role="lecturer">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading question...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/lecturer/questions/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                Edit Question
              </h1>
              {question.timesUsed && question.timesUsed > 0 && (
                <Badge variant="warning">
                  Used in {question.timesUsed} assessments
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Make changes to this question and its grading rubric
            </p>
          </div>
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Warning if question is in use */}
        {question.timesUsed && question.timesUsed > 0 && (
          <Card className="p-4 mb-6 bg-warning/5 border-warning/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-warning mb-1">
                  Question In Use
                </h4>
                <p className="text-sm text-warning/80">
                  This question has been used in {question.timesUsed}{" "}
                  assessments. Changes may affect how existing submissions are
                  graded. Consider duplicating instead if you need a
                  significantly different version.
                </p>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">
                Question Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="text">Question Text *</Label>
                <Textarea
                  id="text"
                  value={question.text}
                  onChange={(e) => updateField("text", e.target.value)}
                  className="mt-1.5 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="modelAnswer">
                  Model Answer (AI Reference) *
                </Label>
                <Textarea
                  id="modelAnswer"
                  value={question.modelAnswer}
                  onChange={(e) => updateField("modelAnswer", e.target.value)}
                  className="mt-1.5 min-h-[150px]"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used by the AI for semantic similarity comparison
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Select
                    value={question.courseCode}
                    onValueChange={(value) => updateField("courseCode", value)}
                  >
                    <SelectTrigger id="courseCode" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSC301">
                        CSC301 - Software Engineering
                      </SelectItem>
                      <SelectItem value="CSC220">
                        CSC220 - Database Systems
                      </SelectItem>
                      <SelectItem value="CSC410">
                        CSC410 - Machine Learning
                      </SelectItem>
                      <SelectItem value="AIE410">
                        AIE410 - AI in Education
                      </SelectItem>
                      <SelectItem value="EDU305">
                        EDU305 - Educational Theory
                      </SelectItem>
                      <SelectItem value="PHY302">
                        PHY302 - Thermodynamics
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={question.subject}
                    onChange={(e) => updateField("subject", e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={question.topic}
                    onChange={(e) => updateField("topic", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={question.difficulty}
                    onValueChange={(value: DifficultyLevel) =>
                      updateField("difficulty", value)
                    }
                  >
                    <SelectTrigger id="difficulty" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxScore">Maximum Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    min="1"
                    max="100"
                    value={question.maxScore}
                    onChange={(e) =>
                      updateField("maxScore", parseInt(e.target.value) || 0)
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Rubric Builder */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">
                  Grading Rubric
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRubricItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Criterion
              </Button>
            </div>

            <div className="space-y-4 mb-4">
              {question.rubric.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Criterion Name</Label>
                          <Input
                            value={item.criterion}
                            onChange={(e) =>
                              updateRubricItem(
                                index,
                                "criterion",
                                e.target.value,
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Weight (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.weight || ""}
                              onChange={(e) =>
                                updateRubricItem(
                                  index,
                                  "weight",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Max Points</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.maxPoints || ""}
                              onChange={(e) =>
                                updateRubricItem(
                                  index,
                                  "maxPoints",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">
                          Description (optional)
                        </Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) =>
                            updateRubricItem(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          className="mt-1 min-h-[60px]"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRubricItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Rubric Summary */}
            <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border border-accent/20">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">
                  Total Weight:{" "}
                  <span
                    className={`font-semibold ${
                      totalWeight === 100 ? "text-success" : "text-warning"
                    }`}
                  >
                    {totalWeight}%
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Total Points:{" "}
                  <span
                    className={`font-semibold ${
                      totalPoints === question.maxScore
                        ? "text-success"
                        : "text-warning"
                    }`}
                  >
                    {totalPoints}/{question.maxScore}
                  </span>
                </span>
              </div>
              {(totalWeight !== 100 || totalPoints !== question.maxScore) && (
                <Badge variant="warning" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Check totals
                </Badge>
              )}
            </div>
          </Card>

          {/* Help Card */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Editing Tips
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Ensure rubric weights sum to 100% and points match max
                    score
                  </li>
                  <li>
                    • Major changes to the model answer will affect AI grading
                    consistency
                  </li>
                  <li>
                    • Consider duplicating if you need a significantly different
                    version
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" asChild>
              <Link to={`/lecturer/questions/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}
