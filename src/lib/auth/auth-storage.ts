import type { User } from '../types/manager';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export interface StoredToken {
  token: string;
}

export const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

export const getAccessToken = (): string | null => {
  try {
    const sessionString = localStorage.getItem(TOKEN_KEY);
    if (!sessionString) return null;

    const sessionData: StoredToken = JSON.parse(sessionString);
    return sessionData?.token || null;
  } catch (error) {
    console.error('Error parsing stored token:', error);
    return null;
  }
};

export const setSession = (user: User, token: string) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token }));
};

export const clearSession = () => {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing session from storage:', error);
  }
};

export const hasSession = (): boolean => {
  return !!localStorage.getItem(TOKEN_KEY);
};
