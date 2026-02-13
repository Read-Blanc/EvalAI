// Grading API Service - Connects to your Python backend
// Update GRADING_API_URL to point to your Python server

const GRADING_API_URL = import.meta.env.VITE_GRADING_API_URL || 'http://localhost:8000';

export interface GradingRequest {
  questionId: string;
  questionText: string;
  modelAnswer: string;
  studentAnswer: string;
  rubric?: RubricCriterion[];
  maxScore?: number;
}

export interface RubricCriterion {
  name: string;
  maxScore: number;
  description?: string;
}

export interface GradingResponse {
  score: number;
  maxScore: number;
  confidence: number;
  rubricBreakdown: {
    name: string;
    score: number;
    max: number;
    feedback: string;
  }[];
  semanticAnalysis: {
    similarityScore: number;
    keyConcepts: string[];
    missingConcepts?: string[];
  };
  feedback: string;
  suggestions?: string[];
}

export interface BatchGradingRequest {
  submissions: {
    submissionId: string;
    studentId: string;
    answers: {
      questionId: string;
      questionText: string;
      modelAnswer: string;
      studentAnswer: string;
      maxScore: number;
    }[];
  }[];
}

export interface BatchGradingResponse {
  results: {
    submissionId: string;
    studentId: string;
    totalScore: number;
    maxTotalScore: number;
    answers: GradingResponse[];
  }[];
}

class GradingApiService {
  private baseUrl: string;

  constructor(baseUrl: string = GRADING_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Grade a single student answer against the model answer
   */
  async gradeAnswer(request: GradingRequest): Promise<GradingResponse> {
    const response = await fetch(`${this.baseUrl}/api/grade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grading API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Grade multiple submissions in batch
   */
  async gradeBatch(request: BatchGradingRequest): Promise<BatchGradingResponse> {
    const response = await fetch(`${this.baseUrl}/api/grade/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch grading API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Regenerate feedback for a graded answer
   */
  async regenerateFeedback(
    questionId: string,
    studentAnswer: string,
    currentScore: number
  ): Promise<{ feedback: string }> {
    const response = await fetch(`${this.baseUrl}/api/feedback/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questionId, studentAnswer, currentScore }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Feedback regeneration error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Check if the grading API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Update the base URL (useful for runtime configuration)
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

export const gradingApi = new GradingApiService();
export default gradingApi;
