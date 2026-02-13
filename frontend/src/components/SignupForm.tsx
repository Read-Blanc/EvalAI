// src/components/auth/SignupForm.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, User, Lock, GraduationCap, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createToastHelpers } from '@/lib/toast-utils';
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/password-validator';
import { fadeInUp } from '@/lib/animations';

export function SignupForm() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { toast } = useToast();
  const toasts = createToastHelpers(toast);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'student' as 'student' | 'lecturer',
    student_id: '',
    staff_id: '',
    terms_accepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordStrength = validatePasswordStrength(formData.password);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Full name validation
    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validation
    if (formData.role === 'student' && !formData.student_id) {
      newErrors.student_id = 'Student ID is required for students';
    }

    if (formData.role === 'lecturer' && !formData.staff_id) {
      newErrors.staff_id = 'Staff ID is required for lecturers';
    }

    // Terms validation
    if (!formData.terms_accepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toasts.error('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        student_id: formData.role === 'student' ? formData.student_id : undefined,
        staff_id: formData.role === 'lecturer' ? formData.staff_id : undefined,
      });

      toasts.success('Account Created!', 'Welcome to EvalAI. Redirecting...');
      
      setTimeout(() => {
        navigate(formData.role === 'student' ? '/student/dashboard' : '/lecturer/dashboard');
      }, 1000);
    } catch (error) {
      toasts.apiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <motion.form {...fadeInUp} onSubmit={handleSubmit} className="space-y-6">
      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role">I am a...</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => handleChange('role', value as 'student' | 'lecturer')}
        >
          <SelectTrigger id="role" className={errors.role ? 'border-destructive' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Student
              </div>
            </SelectItem>
            <SelectItem value="lecturer">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Lecturer / Teacher
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="full_name"
            type="text"
            placeholder="John Doe"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className={`pl-10 ${errors.full_name ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@university.edu"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`pl-10 ${errors.username ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username}</p>
        )}
      </div>

      {/* Student/Staff ID */}
      {formData.role === 'student' && (
        <div className="space-y-2">
          <Label htmlFor="student_id">Student ID</Label>
          <Input
            id="student_id"
            type="text"
            placeholder="STU-2024-001"
            value={formData.student_id}
            onChange={(e) => handleChange('student_id', e.target.value)}
            className={errors.student_id ? 'border-destructive' : ''}
          />
          {errors.student_id && (
            <p className="text-sm text-destructive">{errors.student_id}</p>
          )}
        </div>
      )}

      {formData.role === 'lecturer' && (
        <div className="space-y-2">
          <Label htmlFor="staff_id">Staff ID</Label>
          <Input
            id="staff_id"
            type="text"
            placeholder="STAFF-001"
            value={formData.staff_id}
            onChange={(e) => handleChange('staff_id', e.target.value)}
            className={errors.staff_id ? 'border-destructive' : ''}
          />
          {errors.staff_id && (
            <p className="text-sm text-destructive">{errors.staff_id}</p>
          )}
        </div>
      )}

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= passwordStrength.score
                      ? getPasswordStrengthColor(passwordStrength.score)
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Strength: {getPasswordStrengthLabel(passwordStrength.score)}
            </p>
            {passwordStrength.feedback.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {passwordStrength.feedback.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={formData.terms_accepted}
          onCheckedChange={(checked) => handleChange('terms_accepted', checked)}
          className={errors.terms ? 'border-destructive' : ''}
        />
        <label
          htmlFor="terms"
          className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to the{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms and Conditions
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </label>
      </div>
      {errors.terms && (
        <p className="text-sm text-destructive">{errors.terms}</p>
      )}

      {/* Submit Button */}
      <LoadingButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="Creating account..."
        className="w-full"
        variant="accent"
      >
        Create Account
      </LoadingButton>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Log in
        </Link>
      </p>
    </motion.form>
  );
}