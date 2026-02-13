// AFTER - Refactored AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, AuthResponse, LoginRequest, SignupRequest } from '@/services/authApi';
import { storage } from '@/lib/storage';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'lecturer';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<void>;
  signup: (request: SignupRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    const storedUser = storage.auth.getUser<User>();
    const storedToken = storage.auth.getAccessToken();
    
    if (storedUser && storedToken) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const storeAuthData = (response: AuthResponse) => {
    storage.auth.setTokens(response.access_token, response.refresh_token);
    storage.auth.setUser(response.user);
    setUser(response.user);
  };

  const login = useCallback(async (request: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(request);
      storeAuthData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (request: SignupRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.signup(request);
      storeAuthData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    storage.auth.clearAuth();
    setUser(null);
  }, []);

  // Token refresh logic
  useEffect(() => {
    const refreshToken = storage.auth.getRefreshToken();
    if (!refreshToken) return;

    // Refresh token every 14 minutes (assuming 15 min expiry)
    const interval = setInterval(async () => {
      try {
        const response = await authApi.refreshToken(refreshToken);
        storage.auth.setTokens(response.access_token, response.refresh_token);
      } catch {
        // If refresh fails, logout
        logout();
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [logout, user]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function getAccessToken(): string | null {
  return storage.auth.getAccessToken();
}


