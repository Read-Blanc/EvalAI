// src/pages/lecturer/CreateQuestion.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  BookOpen,
  AlertCircle,
  HelpCircle,
  Sparkles,
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
import type { CreateQuestionFormData, RubricItem } from "@/types";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

export default function CreateQuestion() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateQuestionFormData>({
    text: "",
    modelAnswer: "",
    subject: "",
    courseCode: "",
    topic: "",
    difficulty: "intermediate",
    maxScore: 10,
    rubric: [
      {
        criterion: "Conceptual Understanding",
        description: "",
        weight: 40,
        maxPoints: 4,
      },
      {
        criterion: "Examples & Application",
        description: "",
        weight: 30,
        maxPoints: 3,
      },
      { criterion: "Completeness", description: "", weight: 20, maxPoints: 2 },
      { criterion: "Clarity", description: "", weight: 10, maxPoints: 1 },
    ],
    tags: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof CreateQuestionFormData>(
    field: K,
    value: CreateQuestionFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateRubricItem = (
    index: number,
    field: keyof Omit<RubricItem, "id">,
    value: any,
  ) => {
    const newRubric = [...formData.rubric];
    newRubric[index] = { ...newRubric[index], [field]: value };
    updateField("rubric", newRubric);
  };

  const addRubricItem = () => {
    updateField("rubric", [
      ...formData.rubric,
      { criterion: "", description: "", weight: 0, maxPoints: 0 },
    ]);
  };

  const removeRubricItem = (index: number) => {
    if (formData.rubric.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one rubric criterion.",
        variant: "destructive",
      });
      return;
    }
    const newRubric = formData.rubric.filter((_, i) => i !== index);
    updateField("rubric", newRubric);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.text.trim() || !formData.modelAnswer.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ No .data needed!
      const created = await apiClient.post("/lecturer/questions", {
        question_text: formData.text,
        model_answer: formData.modelAnswer,
        subject: formData.subject,
        topic: formData.topic,
        max_score: formData.maxScore,
        difficulty: formData.difficulty,
      });

      console.log("✅ Question created:", created);

      toast({
        title: "Success!",
        description: "Question created successfully",
      });

      navigate("/lecturer/questions");
    } catch (error) {
      console.error("❌ Failed to create question:", error);

      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.data?.detail || "Failed to create question",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWeight = formData.rubric.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  const totalPoints = formData.rubric.reduce(
    (sum, item) => sum + item.maxPoints,
    0,
  );

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/lecturer/questions">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Create New Question
            </h1>
            <p className="text-sm text-muted-foreground">
              Add a theory question to your question bank for use in assessments
            </p>
          </div>
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Question"}
          </Button>
        </div>

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
                  placeholder="e.g., Explain the difference between supervised and unsupervised learning with examples."
                  value={formData.text}
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
                  placeholder="Provide the ideal answer that SBERT will use as reference for semantic similarity scoring..."
                  value={formData.modelAnswer}
                  onChange={(e) => updateField("modelAnswer", e.target.value)}
                  className="mt-1.5 min-h-[150px]"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This answer will be used by the AI grading system to evaluate
                  student responses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Select
                    value={formData.courseCode}
                    onValueChange={(value) => updateField("courseCode", value)}
                  >
                    <SelectTrigger id="courseCode" className="mt-1.5">
                      <SelectValue placeholder="Select course" />
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
                    placeholder="e.g., Machine Learning"
                    value={formData.subject}
                    onChange={(e) => updateField("subject", e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Supervised Learning"
                    value={formData.topic}
                    onChange={(e) => updateField("topic", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) =>
                      updateField("difficulty", value)
                    }
                  >
                    <SelectTrigger id="difficulty" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="text-xs">
                            Beginner
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Basic concepts
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <div className="flex items-center gap-2">
                          <Badge variant="accent" className="text-xs">
                            Intermediate
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Applied knowledge
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            Advanced
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Complex analysis
                          </span>
                        </div>
                      </SelectItem>
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
                    value={formData.maxScore}
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
              {formData.rubric.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Criterion Name</Label>
                          <Input
                            placeholder="e.g., Conceptual Understanding"
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
                              placeholder="40"
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
                              placeholder="4"
                              value={item.maxPoints || ""}
                              onChange={(e) =>
                                updateRubricItem(
                                  index,
                                  "maxPoints",
                                  parseInt(e.target.value) || 0,
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
                          placeholder="Describe what this criterion measures..."
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
                    className={`font-semibold ${totalWeight === 100 ? "text-success" : "text-warning"}`}
                  >
                    {totalWeight}%
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Total Points:{" "}
                  <span
                    className={`font-semibold ${totalPoints === formData.maxScore ? "text-success" : "text-warning"}`}
                  >
                    {totalPoints}/{formData.maxScore}
                  </span>
                </span>
              </div>
              {(totalWeight !== 100 || totalPoints !== formData.maxScore) && (
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
                  Tips for Good Questions
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Write clear, unambiguous questions that target specific
                    learning outcomes
                  </li>
                  <li>
                    • Provide comprehensive model answers for accurate AI
                    grading
                  </li>
                  <li>
                    • Ensure rubric weights sum to 100% and points match max
                    score
                  </li>
                  <li>
                    • Use rubric criteria that the AI can evaluate semantically
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" asChild>
              <Link to="/lecturer/questions">Cancel</Link>
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Question"}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}
