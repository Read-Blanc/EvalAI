// Auth API Service - Connects to your Python FastAPI backend

const AUTH_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginRequest {
  email: string;
  password: string;
  role?: 'student' | 'lecturer';
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  full_name: string;
  role: 'student' | 'lecturer';
  student_id?: string;
  staff_id?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'lecturer';
  };
}

export interface AuthError {
  detail: string;
}

class AuthApiService {
  private baseUrl: string;

  constructor(baseUrl: string = AUTH_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: AuthError = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || `Login error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Register a new user
   */
  async signup(request: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: AuthError = await response.json().catch(() => ({ detail: 'Signup failed' }));
      throw new Error(error.detail || `Signup error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  /**
   * Update the base URL
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

export const authApi = new AuthApiService();
export default authApi;
