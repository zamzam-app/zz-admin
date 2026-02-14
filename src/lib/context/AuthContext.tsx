import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi } from '../services/api/auth';
import type { User } from '../types/user';


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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
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

      const normalizedToken = {
        token: userData.access_token,
      };

      setUser(normalizedUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token',JSON.stringify(normalizedToken));
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
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
