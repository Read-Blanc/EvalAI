// src/lib/toast-utils.ts
import { useToast } from '@/hooks/use-toast';

type ToastFunction = ReturnType<typeof useToast>['toast'];

export const createToastHelpers = (toast: ToastFunction) => ({
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  },

  error: (title: string, description?: string) => {
    toast({
      title,
      description: description || 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  },

  info: (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  },

  // Specific use cases
  saveSuccess: () => {
    toast({
      title: 'Saved successfully',
      description: 'Your changes have been saved.',
    });
  },

  saveFailed: () => {
    toast({
      title: 'Save failed',
      description: 'Could not save your changes. Please try again.',
      variant: 'destructive',
    });
  },

  apiError: (error: unknown) => {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  },

  loginSuccess: () => {
    toast({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    });
  },

  logoutSuccess: () => {
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  },
});

export default createToastHelpers;