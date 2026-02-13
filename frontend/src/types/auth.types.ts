// src/types/auth.types.ts
// Updated to match backend schema and add industry standards

export interface LoginRequest {
  username: string; // Backend expects username (can be email or username)
  password: string;
  rememberMe?: boolean; // Optional: for extended session
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string; // Client-side validation
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  student_id?: string;
  staff_id?: string;
  terms_accepted: boolean; // Required for legal compliance
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  student_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=weak, 4=strong
  feedback: string[];
  isValid: boolean;
}

// OAuth Provider types
export type OAuthProvider = 'google' | 'microsoft' | 'github';

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  redirectUri: string;
}