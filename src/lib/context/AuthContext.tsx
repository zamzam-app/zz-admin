import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi } from '../services/api/auth';
import type { User } from '../types/manager';
import { getStoredUser, setSession, clearSession } from '../auth/auth-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const userData = await authApi.login({ email, password });

      // ✅ NORMALIZE BACKEND → FRONTEND USER
      const normalizedUser: User = {
        id: userData.user._id,
        name: userData.user.name,
        email: userData.user.email,
        role: userData.user.role,
        outletId: userData.user.outlets || [],
      };

      // 1. Persist session first
      try {
        setSession(normalizedUser, userData.access_token);
      } catch (storageErr) {
        console.error('Session persistence failed:', storageErr);
        throw new Error('Unable to persist session');
      }

      // 2. Only if persistence succeeds, update state
      setUser(normalizedUser);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // even if backend fails, still logout locally
    } finally {
      clearSession();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
