'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { redirect, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if we're in test mode
    const isTestMode = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' && 
       (process.env.NODE_ENV === 'test' || 
        document.querySelector('meta[name="test-mode"]')?.getAttribute('content') === 'true' ||
        window.location.search.includes('test-mode=true')));

    if (isTestMode) {
      // Mock user for tests
      setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
      } as User);
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          // Only redirect to chat if user is on auth page or root
          const currentPath = window.location.pathname;
          if (currentPath === '/auth/signin' || currentPath === '/') {
            router.push('/chat');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Signed out');
        }
        // For 'TOKEN_REFRESHED' events, don't redirect - just update the user state
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}