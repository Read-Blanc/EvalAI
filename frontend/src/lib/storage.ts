// src/lib/storage.ts
// Centralized localStorage utilities with error handling

export const storage = {
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  // Auth-specific helpers
  auth: {
    setTokens(accessToken: string, refreshToken: string): void {
      storage.set('access_token', accessToken);
      storage.set('refresh_token', refreshToken);
    },
    
    getAccessToken(): string | null {
      return storage.get('access_token');
    },
    
    getRefreshToken(): string | null {
      return storage.get('refresh_token');
    },
    
    setUser<T>(user: T): void {
      storage.set('user', user);
    },

    getUser<T>(): T | null {
      return storage.get<T>('user');
    },
    
    clearAuth(): void {
      storage.remove('access_token');
      storage.remove('refresh_token');
      storage.remove('user');
    }
  }
};

export default storage;