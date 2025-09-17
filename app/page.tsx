'use client';

import { useAuth } from '@/components/auth-provider';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      redirect('/chat');
    } else {
      redirect('/auth/signin');
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}