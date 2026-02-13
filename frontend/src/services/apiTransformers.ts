// ==================== API TRANSFORMERS ====================
// This file contains functions to transform data between frontend and backend formats.

// ==================== QUESTIONS ====================

export const transformQuestion = (backendQuestion: any) => ({
  id: backendQuestion.id.toString(),
  text: backendQuestion.question_text,
  modelAnswer: backendQuestion.model_answer,
  subject: backendQuestion.subject,
  courseCode: backendQuestion.subject, // Use subject as courseCode if not separate
  topic: backendQuestion.topic || "General",
  maxScore: backendQuestion.max_score,
  difficulty: backendQuestion.difficulty,
  createdAt: backendQuestion.created_at,
  updatedAt: backendQuestion.updated_at,
  tags: backendQuestion.tags || [],
  rubric: backendQuestion.rubric_criteria ? transformRubricCriteria(backendQuestion.rubric_criteria) : [],
});

export const transformQuestionToBackend = (frontendQuestion: any) => ({
  question_text: frontendQuestion.text,
  model_answer: frontendQuestion.modelAnswer,
  subject: frontendQuestion.subject,
  topic: frontendQuestion.topic,
  max_score: frontendQuestion.maxScore,
  difficulty: frontendQuestion.difficulty,
  tags: frontendQuestion.tags || [],
});

// ==================== ASSESSMENTS/PAPERS ====================

export const transformPaper = (backendPaper: any) => ({
  id: backendPaper.id.toString(),
  title: backendPaper.title,
  description: backendPaper.description || "",
  subject: backendPaper.subject,
  courseCode: backendPaper.subject,
  totalMarks: backendPaper.total_marks,
  duration: backendPaper.duration_minutes,
  durationMinutes: backendPaper.duration_minutes,
  status: backendPaper.is_active ? 'published' : 'draft',
  isActive: backendPaper.is_active,
  difficulty: backendPaper.difficulty,
  createdAt: backendPaper.created_at,
  updatedAt: backendPaper.updated_at,
  questions: backendPaper.questions ? backendPaper.questions.map(transformQuestion) : [],
  questionCount: backendPaper.questions?.length || 0,
});

export const transformPaperToBackend = (frontendPaper: any) => ({
  title: frontendPaper.title,
  description: frontendPaper.description,
  subject: frontendPaper.subject,
  total_marks: frontendPaper.totalMarks,
  duration_minutes: frontendPaper.duration,
  is_active: frontendPaper.status === 'published',
  difficulty: frontendPaper.difficulty,
  question_ids: frontendPaper.questionIds || [],
});

// ==================== SUBMISSIONS ====================

export const transformSubmission = (backendSubmission: any) => ({
  id: backendSubmission.submission_id?.toString() || backendSubmission.id?.toString(),
  assessmentId: backendSubmission.paper_id?.toString(),
  assessmentTitle: backendSubmission.paper_title,
  studentId: backendSubmission.student_id?.toString(),
  studentName: backendSubmission.student_name,
  submittedAt: backendSubmission.submitted_at,
  overallGrade: backendSubmission.total_score,
  totalScore: backendSubmission.total_score,
  maxGrade: backendSubmission.max_score,
  maxScore: backendSubmission.max_score,
  percentage: backendSubmission.percentage,
  sbertSimilarity: backendSubmission.avg_similarity || 0,
  avgSimilarity: backendSubmission.avg_similarity || 0,
  rubricAdherence: backendSubmission.percentage || 0,
  gradedAt: backendSubmission.graded_at,
  isGraded: !!backendSubmission.graded_at,
  questions: backendSubmission.question_results 
    ? backendSubmission.question_results.map(transformQuestionResult)
    : [],
});

export const transformQuestionResult = (backendResult: any, index?: number) => ({
  id: backendResult.id?.toString() || `q${(index || 0) + 1}`,
  questionId: backendResult.question_id?.toString(),
  number: backendResult.question_number || (index || 0) + 1,
  title: backendResult.question_text 
    ? (backendResult.question_text.substring(0, 50) + (backendResult.question_text.length > 50 ? '...' : ''))
    : "Question",
  prompt: backendResult.question_text,
  questionText: backendResult.question_text,
  studentAnswer: backendResult.student_answer,
  modelAnswer: backendResult.model_answer,
  score: backendResult.score,
  maxScore: backendResult.max_score,
  similarity: backendResult.similarity || 0,
  wordCount: backendResult.student_answer?.split(' ').length || 0,
  rubricBreakdown: backendResult.rubric_scores 
    ? transformRubricScores(backendResult.rubric_scores)
    : [],
  feedback: backendResult.feedback || "",
});

// ==================== RUBRICS ====================

export const transformRubricCriteria = (rubricCriteria: any) => {
  if (Array.isArray(rubricCriteria)) {
    return rubricCriteria.map((criterion, idx) => ({
      id: criterion.id?.toString() || `rc${idx}`,
      criterion: criterion.name || criterion.criterion,
      description: criterion.description || "",
      weight: criterion.weight,
      maxPoints: criterion.max_points || criterion.maxPoints,
    }));
  }
  
  // If it's an object with criteria as keys
  return Object.entries(rubricCriteria).map(([key, value]: [string, any], idx) => ({
    id: `rc${idx}`,
    criterion: key,
    description: value.description || "",
    weight: value.weight,
    maxPoints: value.max_points || value.maxPoints,
  }));
};

export const transformRubricScores = (rubricScores: any) => {
  if (!rubricScores) return [];
  
  if (Array.isArray(rubricScores)) {
    return rubricScores.map((score, idx) => ({
      id: `rs${idx}`,
      criterion: score.criterion || score.name,
      score: score.score,
      maxScore: score.max_score || score.maxScore,
      match: ((score.score / (score.max_score || score.maxScore)) * 100) || 0,
      feedback: score.feedback || `Score: ${score.score}/${score.max_score || score.maxScore}`,
      weight: score.weight,
    }));
  }
  
  // If it's an object with criteria as keys
  return Object.entries(rubricScores).map(([criterion, data]: [string, any], idx) => ({
    id: `rs${idx}`,
    criterion: criterion,
    score: data.score,
    maxScore: data.max_score,
    match: ((data.score / data.max_score) * 100) || 0,
    feedback: data.feedback || `Score: ${data.score}/${data.max_score}`,
    weight: data.weight,
  }));
};

// ==================== STUDENTS ====================

export const transformStudent = (backendStudent: any) => ({
  id: backendStudent.id.toString(),
  name: backendStudent.full_name || `${backendStudent.first_name} ${backendStudent.last_name}`,
  firstName: backendStudent.first_name,
  lastName: backendStudent.last_name,
  email: backendStudent.email,
  matricNumber: backendStudent.matric_number || backendStudent.student_id,
  studentId: backendStudent.student_id || backendStudent.matric_number,
  department: backendStudent.department,
  level: backendStudent.level,
  createdAt: backendStudent.created_at,
});

// ==================== STATISTICS ====================

export const transformQuestionStats = (backendStats: any) => ({
  timesUsed: backendStats.times_used || 0,
  avgScore: backendStats.avg_score || 0,
  lastUsed: backendStats.last_used,
  scoreDistribution: backendStats.score_distribution || [],
  totalAttempts: backendStats.total_attempts || 0,
});

export const transformAssessmentStats = (backendStats: any) => ({
  totalSubmissions: backendStats.total_submissions || 0,
  gradedSubmissions: backendStats.graded_submissions || 0,
  averageScore: backendStats.average_score || 0,
  highestScore: backendStats.highest_score || 0,
  lowestScore: backendStats.lowest_score || 0,
  completionRate: backendStats.completion_rate || 0,
  scoreDistribution: backendStats.score_distribution || [],
});

// ==================== UTILITY FUNCTIONS ====================

export const transformDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    full: date.toISOString(),
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
    relative: getRelativeTime(date),
  };
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

// ==================== ERROR TRANSFORMERS ====================

export const transformApiError = (error: any) => {
  if (error.data?.detail) {
    return typeof error.data.detail === 'string' 
      ? error.data.detail 
      : error.data.detail.message || "An error occurred";
  }
  
  if (error.message) {
    return error.message;
  }
  
  return "An unexpected error occurred";
};