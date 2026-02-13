// src/components/auth/ForgotPasswordForm.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createToastHelpers } from '@/lib/toast-utils';
import { fadeInUp } from '@/lib/animations';

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const toasts = createToastHelpers(toast);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // await authApi.requestPasswordReset({ email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toasts.success('Email Sent', 'Check your inbox for password reset instructions.');
    } catch (error) {
      toasts.apiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div {...fadeInUp} className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
          <p className="text-muted-foreground">
            We've sent password reset instructions to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>Didn't receive the email? Check your spam folder.</p>
          <button
            onClick={() => setIsSuccess(false)}
            className="text-primary hover:underline"
          >
            Try a different email address
          </button>
        </div>

        <Button variant="outline" asChild className="w-full">
          <Link to="/login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeInUp} className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">Forgot password?</h2>
        <p className="text-muted-foreground">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className={`pl-10 ${error ? 'border-destructive' : ''}`}
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Sending..."
          className="w-full"
          variant="accent"
        >
          Send Reset Link
        </LoadingButton>

        <Button variant="ghost" asChild className="w-full">
          <Link to="/login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Link>
        </Button>
      </form>
    </motion.div>
  );
}