// src/pages/lecturer/QuestionBank.tsx
// ✅ UPDATED: Using fetch-based apiClient (no .data needed!)

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  BookOpen,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { apiClient } from "@/services/apiClient";
import { ApiError } from "@/lib/utils";

// Types
interface Question {
  id: number;
  question_text: string;
  model_answer: string;
  subject: string;
  topic: string;
  max_score: number;
  difficulty: string;
  created_at?: string;
}

export default function QuestionBank() {
  const { toast } = useToast();

  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);

        // ✅ No .data needed! Returns data directly!
        const data = await apiClient.get<Question[]>("/lecturer/questions");

        console.log("✅ Questions loaded:", data);
        setQuestions(data);
      } catch (error) {
        console.error("❌ Failed to fetch questions:", error);

        if (error instanceof ApiError) {
          toast({
            title: "Error",
            description: error.data?.detail || "Failed to load questions",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [toast]);

  // Filter questions
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.question_text
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      question.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.topic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      subjectFilter === "all" || question.subject === subjectFilter;

    const matchesDifficulty =
      difficultyFilter === "all" || question.difficulty === difficultyFilter;

    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  // Delete question
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await apiClient.delete(`/lecturer/questions/${id}`);

      setQuestions(questions.filter((q) => q.id !== id));

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.data?.detail || "Failed to delete question",
          variant: "destructive",
        });
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout role="lecturer">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Question Bank
            </h1>
            <p className="text-muted-foreground">
              Manage your question library ({filteredQuestions.length}{" "}
              questions)
            </p>
          </div>
          <Button asChild>
            <Link to="/lecturer/questions/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Question
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Subject Filter */}
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Computer Science">
                  Computer Science
                </SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Questions List */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredQuestions.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                No questions found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first question"}
              </p>
              <Button asChild>
                <Link to="/lecturer/questions/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question
                </Link>
              </Button>
            </Card>
          ) : (
            filteredQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                variants={staggerItem}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{question.subject}</Badge>
                        <Badge
                          variant={
                            question.difficulty === "beginner"
                              ? "success"
                              : question.difficulty === "intermediate"
                                ? "accent"
                                : "warning"
                          }
                        >
                          {question.difficulty}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {question.max_score} points
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {question.question_text}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Topic: {question.topic}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/lecturer/questions/${question.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/lecturer/questions/${question.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
