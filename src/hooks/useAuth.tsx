import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { showToast } from '../components/ui/Toast';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapUser(session.user).then(setUser);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapUser(session.user).then(setUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapUser = async (supabaseUser: any): Promise<User> => {
    // Check if user is admin based on email (or you could check a public.users table)
    // For now, we'll keep the hardcoded admin check for simplicity, 
    // but ideally this should be a database role or claim.
    const adminEmails = new Set(['admin@example.com', 'gigsdev007@gmail.com']);
    const email = (supabaseUser.email || '').toLowerCase().trim();
    const isAdmin = adminEmails.has(email);

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      isAdmin,
    };
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast(error.message, 'error');
      throw error;
    }

    if (data.user) {
      const u = await mapUser(data.user);
      return u;
    }

    throw new Error('Login failed');
  };

  const signup = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      showToast(error.message, 'error');
      throw error;
    }

    if (data.user) {
      const u = await mapUser(data.user);
      return u;
    }

    throw new Error('Signup failed');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
