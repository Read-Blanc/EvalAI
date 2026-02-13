import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import gradingApi, { 
  GradingRequest, 
  GradingResponse, 
  BatchGradingRequest,
  BatchGradingResponse 
} from '@/services/gradingApi';

interface UseGradingOptions {
  onSuccess?: (result: GradingResponse) => void;
  onError?: (error: Error) => void;
}

export function useGrading(options: UseGradingOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GradingResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const gradeAnswer = useCallback(async (request: GradingRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await gradingApi.gradeAnswer(request);
      setResult(response);
      options.onSuccess?.(response);
      
      toast({
        title: "Grading Complete",
        description: `Score: ${response.score}/${response.maxScore} (${Math.round(response.confidence * 100)}% confidence)`,
      });
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      
      toast({
        title: "Grading Failed",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const regenerateFeedback = useCallback(async (
    questionId: string,
    studentAnswer: string,
    currentScore: number
  ) => {
    setIsLoading(true);
    
    try {
      const response = await gradingApi.regenerateFeedback(questionId, studentAnswer, currentScore);
      
      if (result) {
        setResult({ ...result, feedback: response.feedback });
      }
      
      toast({
        title: "Feedback Regenerated",
        description: "New feedback has been generated.",
      });
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      toast({
        title: "Regeneration Failed",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [result, toast]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    gradeAnswer,
    regenerateFeedback,
    reset,
    isLoading,
    result,
    error,
  };
}

interface UseBatchGradingOptions {
  onSuccess?: (results: BatchGradingResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (completed: number, total: number) => void;
}

export function useBatchGrading(options: UseBatchGradingOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BatchGradingResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const { toast } = useToast();

  const gradeBatch = useCallback(async (request: BatchGradingRequest) => {
    setIsLoading(true);
    setError(null);
    setProgress({ completed: 0, total: request.submissions.length });

    try {
      const response = await gradingApi.gradeBatch(request);
      setResults(response);
      setProgress({ completed: request.submissions.length, total: request.submissions.length });
      options.onSuccess?.(response);
      
      toast({
        title: "Batch Grading Complete",
        description: `Successfully graded ${response.results.length} submissions.`,
      });
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      
      toast({
        title: "Batch Grading Failed",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setProgress({ completed: 0, total: 0 });
  }, []);

  return {
    gradeBatch,
    reset,
    isLoading,
    results,
    error,
    progress,
  };
}

export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const healthy = await gradingApi.healthCheck();
      setIsHealthy(healthy);
      return healthy;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { isHealthy, isChecking, checkHealth };
}
