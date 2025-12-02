import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { showToast } from '../components/ui/Toast';
import { adminConfig, normalizeEmail } from '../config/admin';

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

  /**
   * Ensures a user profile exists in the database
   * Creates a profile if missing, handles errors gracefully
   * 
   * @param supabaseUser - The authenticated Supabase user
   */
  const ensureUserProfile = async (supabaseUser: any): Promise<void> => {
    console.log(`Checking profile for user: ${redactEmail(supabaseUser.email)}`);
    
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();

      // If profile exists, we're done
      if (existingProfile && !fetchError) {
        console.log(`Profile exists for user: ${redactEmail(supabaseUser.email)}`);
        return;
      }

      // Profile doesn't exist, create it
      console.log(`Creating profile for user: ${redactEmail(supabaseUser.email)}`);
      
      const { error: insertError } = await (supabase
        .from('user_profiles')
        .insert as any)({
          id: supabaseUser.id,
          email: normalizeEmail(supabaseUser.email || ''),
          full_name: supabaseUser.user_metadata?.full_name || null,
          is_active: true,
          subscription_plan: 'Free',
          last_login: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`Failed to create profile for user ${supabaseUser.id}:`, insertError.message);
        // Don't throw - allow login to proceed
      } else {
        console.log(`Successfully created profile for user: ${redactEmail(supabaseUser.email)}`);
      }
    } catch (error: any) {
      console.error(`Profile operation failed for user ${supabaseUser.id}:`, error?.message || error);
      // Don't throw - allow login to proceed
    }
  };

  /**
   * Redacts sensitive information from email for logging
   * Shows first 3 characters and domain
   * 
   * @param email - The email to redact
   * @returns Redacted email string
   */
  const redactEmail = (email: string | undefined): string => {
    if (!email) return '[no email]';
    const parts = email.split('@');
    if (parts.length !== 2) return '[invalid email]';
    const localPart = parts[0];
    const domain = parts[1];
    const redacted = localPart.length > 3 
      ? `${localPart.substring(0, 3)}***@${domain}`
      : `***@${domain}`;
    return redacted;
  };

  /**
   * Redacts sensitive data from any value for safe logging
   * Removes passwords, tokens, and other sensitive information
   * 
   * @param data - The data to redact
   * @returns Redacted data safe for logging
   */
  const redactSensitiveData = (data: any): any => {
    if (typeof data === 'string') {
      // Check if string looks like a token or password
      if (data.length > 20 && /^[A-Za-z0-9_-]+$/.test(data)) {
        return '[REDACTED_TOKEN]';
      }
      return data;
    }
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(redactSensitiveData);
    }
    
    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Redact sensitive fields
      if (lowerKey.includes('password') || 
          lowerKey.includes('token') || 
          lowerKey.includes('secret') ||
          lowerKey.includes('key') ||
          lowerKey.includes('auth')) {
        redacted[key] = '[REDACTED]';
      } else if (lowerKey.includes('email')) {
        redacted[key] = typeof value === 'string' ? redactEmail(value) : value;
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    
    return redacted;
  };

  /**
   * Categorizes authentication errors into user-friendly messages
   * Maps technical Supabase errors to clear, actionable messages
   * 
   * @param error - The error object from authentication attempt
   * @returns User-friendly error message
   */
  const categorizeError = (error: any): string => {
    const errorMessage = error?.message || '';
    
    // Invalid credentials
    if (errorMessage.includes('Invalid login credentials') || 
        errorMessage.includes('Invalid email or password')) {
      return 'Invalid email or password';
    }
    
    // Network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('timeout')) {
      return 'Network error. Please check your connection';
    }
    
    // Database errors
    if (errorMessage.includes('database') || 
        errorMessage.includes('relation') || 
        errorMessage.includes('column') ||
        errorMessage.includes('table') ||
        errorMessage.includes('query')) {
      return 'System error. Please try again later';
    }
    
    // Generic fallback
    return 'An unexpected error occurred. Please try again';
  };

  const mapUser = async (supabaseUser: any): Promise<User> => {
    // Normalize email and check admin status using centralized configuration
    const normalizedEmail = normalizeEmail(supabaseUser.email || '');
    const isAdmin = adminConfig.isAdmin(normalizedEmail);
    
    console.log(`Admin status check for ${redactEmail(supabaseUser.email)}: ${isAdmin}`);

    // Ensure user profile exists (non-blocking)
    try {
      await ensureUserProfile(supabaseUser);
    } catch (error: any) {
      console.error('Profile verification failed:', error?.message || error);
      // Continue with login even if profile operations fail
    }

    // Update last_login timestamp in user_profiles (non-blocking)
    try {
      const { error: updateError } = await (supabase
        .from('user_profiles')
        .update as any)({ last_login: new Date().toISOString() })
        .eq('id', supabaseUser.id);

      if (updateError) {
        console.error(`Failed to update last_login for user ${supabaseUser.id}:`, updateError.message);
      }
    } catch (error: any) {
      console.error('Last login update failed:', error?.message || error);
      // Don't block login if this fails
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      isAdmin,
    };
  };

  const login = async (email: string, password: string) => {
    console.log(`Login attempt for: ${redactEmail(email)}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        console.error(`Authentication failed for ${redactEmail(email)}:`, error.message);
        const userFriendlyMessage = categorizeError(error);
        showToast(userFriendlyMessage, 'error');
        throw error;
      }

      if (data.user) {
        console.log(`Authentication successful for: ${redactEmail(email)}`);
        const u = await mapUser(data.user);
        return u;
      }

      throw new Error('Login failed');
    } catch (error: any) {
      // Log authentication failure with redacted information
      console.error('Login attempt failed:', {
        email: redactEmail(email),
        error: error?.message || 'Unknown error',
        // Never log password or tokens
      });
      throw error;
    }
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
