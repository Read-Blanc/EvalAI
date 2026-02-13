// src/pages/lecturer/CreateAssessment.tsx
// ✅ COMPLETE FILE - Using real API for questions, no mock data!

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Check,
  X,
  Clock,
  FileText,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Settings2,
  Eye,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Question {
  id: number;
  question_text: string;
  subject: string;
  topic: string;
  max_score: number;
  difficulty: string;
}

interface Section {
  id: string;
  title: string;
  instructions: string;
  questions: Question[];
  isExpanded: boolean;
}

export default function CreateAssessment() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Assessment metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("60");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [sections, setSections] = useState<Section[]>([
    {
      id: "section-1",
      title: "Section A",
      instructions: "Answer all questions in this section.",
      questions: [],
      isExpanded: true,
    },
  ]);

  // Question bank from API
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Question picker modal
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  // Publish dialog
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        const data = await apiClient.get<Question[]>("/lecturer/questions");
        setQuestionBank(data);
      } catch (error) {
        console.error("Failed to load questions:", error);
        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: "Failed to load questions from bank",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [toast]);

  // Calculate totals
  const totalQuestions = sections.reduce(
    (acc, s) => acc + s.questions.length,
    0,
  );
  const totalMarks = sections.reduce(
    (acc, s) =>
      acc + s.questions.reduce((q, question) => q + question.max_score, 0),
    0,
  );

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: `Section ${String.fromCharCode(65 + sections.length)}`,
      instructions: "",
      questions: [],
      isExpanded: true,
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length === 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one section.",
        variant: "destructive",
      });
      return;
    }
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const toggleSectionExpand = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s,
      ),
    );
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s)),
    );
  };

  const updateSectionInstructions = (
    sectionId: string,
    instructions: string,
  ) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, instructions } : s)),
    );
  };

  const openQuestionPicker = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const section = sections.find((s) => s.id === sectionId);
    setSelectedQuestions(section?.questions.map((q) => q.id) || []);
    setIsQuestionPickerOpen(true);
  };

  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const confirmQuestionSelection = () => {
    if (!activeSectionId) return;
    const selected = questionBank.filter((q) =>
      selectedQuestions.includes(q.id),
    );
    setSections(
      sections.map((s) =>
        s.id === activeSectionId ? { ...s, questions: selected } : s,
      ),
    );
    setIsQuestionPickerOpen(false);
    setActiveSectionId(null);
    setSelectedQuestions([]);
    setSearchQuery("");
  };

  const removeQuestionFromSection = (sectionId: string, questionId: number) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s,
      ),
    );
  };

  const handlePublish = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter an assessment title.",
        variant: "destructive",
      });
      return;
    }
    if (totalQuestions === 0) {
      toast({
        title: "No questions",
        description: "Please add at least one question to publish.",
        variant: "destructive",
      });
      return;
    }
    setIsPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    setIsSubmitting(true);

    try {
      // Create the assessment
      const assessmentData = {
        title,
        description,
        subject,
        total_marks: totalMarks,
        duration_minutes: parseInt(duration),
        difficulty,
        question_ids: sections.flatMap((s) => s.questions.map((q) => q.id)),
      };

      await apiClient.post("/lecturer/assessments", assessmentData);

      toast({
        title: "Assessment published!",
        description: "Students can now access this assessment.",
      });

      setIsPublishDialogOpen(false);
      navigate("/lecturer/assessments");
    } catch (error) {
      console.error("Failed to publish:", error);
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.data?.detail || "Failed to publish assessment",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuestions = questionBank.filter(
    (q) =>
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardLayout role="lecturer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/lecturer/assessments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Create Assessment
            </h1>
            <p className="text-sm text-muted-foreground">
              Build a new theory-based assessment paper
            </p>
          </div>
          <Button
            variant="accent"
            onClick={handlePublish}
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Publishing..." : "Publish"}
          </Button>
        </div>

        {/* Summary Bar */}
        <div className="mb-6 p-4 bg-card rounded-xl border border-border flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">
                  {totalQuestions}
                </span>{" "}
                <span className="text-muted-foreground">questions</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">
                  {totalMarks}
                </span>{" "}
                <span className="text-muted-foreground">marks</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">
                  {duration}
                </span>{" "}
                <span className="text-muted-foreground">minutes</span>
              </span>
            </div>
          </div>
        </div>

        {/* Assessment Details */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">
              Assessment Details
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Midterm Exam - Software Engineering"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g., Computer Science"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="10"
                max="300"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Sections & Questions
            </h2>
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>

          {sections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) =>
                    updateSectionTitle(section.id, e.target.value)
                  }
                  className="flex-1 bg-transparent font-semibold text-foreground focus:outline-none"
                />
                <Badge variant="muted">
                  {section.questions.length} questions
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSectionExpand(section.id)}
                >
                  {section.isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {section.isExpanded && (
                <div className="p-4 space-y-4">
                  {section.questions.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        No questions added
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openQuestionPicker(section.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Questions
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {section.questions.map((q, i) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          <span className="text-xs font-medium text-muted-foreground mt-1">
                            {i + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">
                              {q.question_text}
                            </p>
                            <Badge variant="muted" className="text-xs mt-1">
                              {q.max_score} marks
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeQuestionFromSection(section.id, q.id)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => openQuestionPicker(section.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Question Picker Dialog */}
      <Dialog
        open={isQuestionPickerOpen}
        onOpenChange={setIsQuestionPickerOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Questions</DialogTitle>
            <DialogDescription>
              Choose questions from the question bank
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoadingQuestions ? (
              <p className="text-center text-muted-foreground py-8">
                Loading questions...
              </p>
            ) : filteredQuestions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No questions found
              </p>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = selectedQuestions.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestionSelection(q.id)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{q.question_text}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="muted" className="text-xs">
                            {q.subject}
                          </Badge>
                          <Badge variant="muted" className="text-xs">
                            {q.max_score} marks
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsQuestionPickerOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmQuestionSelection}>Add Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Assessment</DialogTitle>
            <DialogDescription>
              Confirm publishing this assessment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Title</span>
              <span className="font-medium">{title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Questions</span>
              <span className="font-medium">{totalQuestions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Marks</span>
              <span className="font-medium">{totalMarks}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmPublish} disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Confirm & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
