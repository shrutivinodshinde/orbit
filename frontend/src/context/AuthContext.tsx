import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthUser } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('orbit_token');
    const storedUser = localStorage.getItem('orbit_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await authApi.login(email, password);
    localStorage.setItem('orbit_token', result.accessToken);
    localStorage.setItem('orbit_user', JSON.stringify(result.user));
    setToken(result.accessToken);
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem('orbit_token');
    localStorage.removeItem('orbit_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}