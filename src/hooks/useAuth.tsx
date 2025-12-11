import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { showToast } from '../components/ui/Toast';
import { adminConfig, normalizeEmail } from '../config/admin';
import { authStateManager } from '../utils/auth-state-manager';

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
  initialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name?: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication state...');

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error retrieving session:', error.message);
          if (isMounted) {
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user) {
          console.log(`Session found for user: ${redactEmail(session.user.email)}`);
          try {
            const mappedUser = await mapUser(session.user);
            if (isMounted) {
              setUser(mappedUser);
              console.log('Authentication state recovered from session');
            }
          } catch (mapError: any) {
            console.error('Error mapping user from session:', mapError?.message || mapError);
            if (isMounted) {
              setUser(null);
            }
          }
        } else {
          console.log('No existing session found');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (initError: any) {
        console.error('Authentication initialization failed:', initError?.message || initError);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
          console.log('Authentication initialization complete');
        }
      }
    };

    // Initialize authentication state
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log(`Auth state change: ${event}`);

      try {
        if (session?.user) {
          console.log(`User authenticated: ${redactEmail(session.user.email)}`);
          const mappedUser = await mapUser(session.user);
          setUser(mappedUser);

          // Notify auth state manager of login
          authStateManager.handleLogin(mappedUser, 'local');
        } else {
          console.log('User signed out or session expired');
          setUser(null);

          // Notify auth state manager of logout
          authStateManager.handleLogout('local');
        }
      } catch (error: any) {
        console.error('Error handling auth state change:', error?.message || error);
        setUser(null);
        authStateManager.handleLogout('local');
      }

      // Ensure loading is false after any auth state change
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
    // We don't await this anymore to speed up login
    ensureUserProfile(supabaseUser).catch(error => {
      console.error('Background profile verification failed:', error?.message || error);
    });

    // Update last_login timestamp in user_profiles (non-blocking)
    // We don't await this anymore to speed up login
    (async () => {
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
      }
    })();

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
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        console.error(`Authentication failed for ${redactEmail(email)}:`, error.message);
        const userFriendlyMessage = categorizeError(error);
        showToast(userFriendlyMessage, 'error');
        setLoading(false);
        throw error;
      }

      if (data.user) {
        console.log(`Authentication successful for: ${redactEmail(email)}`);
        const u = await mapUser(data.user);
        // Note: loading will be set to false by the auth state change listener
        return u;
      }

      setLoading(false);
      throw new Error('Login failed');
    } catch (error: any) {
      // Log authentication failure with redacted information
      console.error('Login attempt failed:', {
        email: redactEmail(email),
        error: error?.message || 'Unknown error',
        // Never log password or tokens
      });
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    console.log(`Signup attempt for: ${redactEmail(email)}`);
    setLoading(true);

    try {
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
        console.error(`Signup failed for ${redactEmail(email)}:`, error.message);
        showToast(error.message, 'error');
        setLoading(false);
        throw error;
      }

      if (data.user) {
        console.log(`Signup successful for: ${redactEmail(email)}`);

        // Immediately ensure user profile exists (fallback mechanism)
        try {
          await ensureUserProfile(data.user);
          console.log(`[FALLBACK_PROFILE_CREATION] Profile ensured for user: ${redactEmail(email)}`);
        } catch (profileError: any) {
          // Log error but don't block signup
          console.error(`[FALLBACK_PROFILE_CREATION_FAILED] User ${data.user.id}:`, profileError?.message || profileError);
          // Continue with signup flow - profile will be created on next login
        }

        const u = await mapUser(data.user);
        // Note: loading will be set to false by the auth state change listener
        return u;
      }

      setLoading(false);
      throw new Error('Signup failed');
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logout initiated');
    setLoading(true);

    try {
      // Notify auth state manager before logout
      authStateManager.handleLogout('manual');

      await supabase.auth.signOut();
      // Note: user will be set to null by the auth state change listener
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error?.message || error);
      // Even if logout fails, clear the user state
      setUser(null);
      setLoading(false);
      authStateManager.handleLogout('manual');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, signup, logout }}>
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
