import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name?: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sophia_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    // Minimal mock authentication: accept any password, mark specific emails as admin
    const adminEmails = new Set(['admin@example.com', 'gigsdev007@gmail.com']);
    const isAdmin = adminEmails.has(email);
    const u: User = {
      id: email,
      email,
      name: email.split('@')[0],
      avatarUrl: null,
      isAdmin,
    };
    persist(u);
    return u;
  };

  const signup = async (email: string, password: string, name?: string) => {
    const adminEmails = new Set(['admin@example.com', 'gigsdev007@gmail.com']);
    const isAdmin = adminEmails.has(email);
    const u: User = {
      id: email,
      email,
      name: name || email.split('@')[0],
      avatarUrl: null,
      isAdmin,
    };
    persist(u);
    return u;
  };

  const logout = () => {
    persist(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { User };
