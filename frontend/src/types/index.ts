// src/types/index.ts
// TypeScript interfaces for the EvalAI application

import { ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'student' | 'lecturer' | 'admin';
  studentId?: string;
  staffId?: string;
  createdAt: string;
}

export interface RubricItem {
  id: string;
  criterion: string;
  description: string;
  weight: number;
  maxPoints: number;
}

export interface Question {
  id: string;
  text: string;
  modelAnswer: string;
  subject: string;
  courseCode: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  maxScore: number;
  rubric: RubricItem[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  timesUsed?: number;
  avgScore?: number;
  tags?: string[];
}

export interface Assessment {
  is_active: boolean;
  subject: any;
  id: string;
  title: string;
  description: string;
  courseCode: string;
  duration: number; // minutes
  totalMarks: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'archived';
  sections: AssessmentSection[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalQuestions?: number;
  submissionsCount?: number;
}

export interface AssessmentSection {
  id: string;
  title: string;
  instructions: string;
  questions: Question[];
  order: number;
}

export interface Submission {
  data(data: any): unknown;
  courseCode: ReactNode;
  courseName: ReactNode;
  sbertSimilarity: any;
  sbertPercentile: ReactNode;
  rubricAdherence: ReactNode;
  rubricNote: ReactNode;
  aiConfidence: ReactNode;
  questions: any;
  overallGrade: any;
  maxGrade: any;
  gradeLabel: ReactNode;
  percentage: ReactNode;
  student: any;
  aiConfidencePercent: ReactNode;
  plagiarismNote: ReactNode;
  plagiarismCheck: ReactNode;
  id: string;
  studentId: string;
  studentName?: string;
  assessmentId: string;
  assessmentTitle?: string;
  answers: Answer[];
  submittedAt: string;
  status: 'pending' | 'grading' | 'graded' | 'reviewed';
  totalScore?: number;
  maxScore?: number;
  timeSpent?: number; // minutes
  gradedAt?: string;
  gradedBy?: string;
}

export interface Answer {
  id: string;
  questionId: string;
  questionText?: string;
  studentAnswer: string;
  submittedAt: string;
  aiGradingResult?: AIGradingResult;
  finalGrade?: FinalGrade;
}

export interface AIGradingResult {
  score: number;
  maxScore: number;
  confidence: number; // 0-1
  similarityScore: number; // 0-1
  feedback: string;
  rubricBreakdown: RubricScore[];
  semanticAnalysis: SemanticAnalysis;
  generatedAt: string;
}

export interface RubricScore {
  criterionId: string;
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface SemanticAnalysis {
  similarityScore: number; // 0-1
  keyConcepts: string[];
  missingConcepts?: string[];
  matchedKeywords?: string[];
}

export interface FinalGrade {
  score: number;
  maxScore: number;
  lecturerFeedback?: string;
  gradedBy: string;
  gradedAt: string;
  isAIAccepted: boolean;
  overrideReason?: string;
}

export interface QuestionFilters {
  search?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  courseCode?: string;
  sortBy?: 'created' | 'usage' | 'score';
  sortOrder?: 'asc' | 'desc';
}

export interface AssessmentFilters {
  search?: string;
  status?: 'draft' | 'published' | 'archived' | 'all';
  courseCode?: string;
  sortBy?: 'created' | 'dueDate' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationData;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

// Form types
export interface CreateQuestionFormData {
  text: string;
  modelAnswer: string;
  subject: string;
  courseCode: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  maxScore: number;
  rubric: Omit<RubricItem, 'id'>[];
  tags?: string[];
}

export interface CreateAssessmentFormData {
  title: string;
  description: string;
  courseCode: string;
  duration: number;
  startDate: string;
  endDate: string;
  sections: {
    title: string;
    instructions: string;
    questionIds: string[];
  }[];
}

// Analytics types
export interface PerformanceData {
  period: string;
  score: number;
  submissions: number;
}

export interface ConceptPerformance {
  concept: string;
  avgScore: number;
  timesAssessed: number;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  avgScore: number;
  totalSubmissions: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
}