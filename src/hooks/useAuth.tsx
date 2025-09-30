import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event === 'SIGNED_IN') {
          // Update last_login in profiles table
          setTimeout(async () => {
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Enhanced initial session check with validation
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Session error:', error);
          // Clear any invalid session data
          localStorage.removeItem('supabase.auth.token');
          setSession(null);
          setUser(null);
        } else if (session) {
          // Verify session is actually valid by making a test request
          const { error: testError } = await supabase.auth.getUser();
          if (testError) {
            console.log('Session invalid:', testError);
            // Force clear invalid session
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
            setSession(null);
            setUser(null);
          } else {
            setSession(session);
            setUser(session.user);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.log('Auth initialization error:', error);
        // Clear everything on error
        localStorage.removeItem('supabase.auth.token');
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: userData
      }
    });
    return { error };
  };

  const signOut = async () => {
    console.log('Starting logout process...');
    
    try {
      // Try graceful logout first
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('Logout error (trying force cleanup):', error);
      }
    } catch (error) {
      console.log('Logout exception (trying force cleanup):', error);
    }
    
    // Force clear auth data but PRESERVE trusted device data
    try {
      // Preserve trusted device data before clearing
      const trustedDevices = localStorage.getItem('aksell_trusted_devices');
      const deviceFingerprint = localStorage.getItem('aksell_device_fingerprint');
      
      // Clear Supabase auth tokens (both old and new project)
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-chgkxvzsxtfobxwosfcx-auth-token'); // Old project
      localStorage.removeItem('sb-nahyrexnxhzutfeqxjte-auth-token'); // New project
      
      // Restore trusted device data
      if (trustedDevices) {
        localStorage.setItem('aksell_trusted_devices', trustedDevices);
      }
      if (deviceFingerprint) {
        localStorage.setItem('aksell_device_fingerprint', deviceFingerprint);
      }
      
      console.log('✅ Auth data cleared, trusted device data preserved');
    } catch (e) {
      console.log('LocalStorage operation error:', e);
    }
    
    // Clear local state
    setSession(null);
    setUser(null);
    
    console.log('Logout completed, state cleared');
    
    // Force page reload as fallback to ensure complete cleanup
    setTimeout(() => {
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }, 100);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/definir-senha`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};