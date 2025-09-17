'use client';

import { useAuth } from '@/components/auth-provider';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MemoriesLibrary } from '@/components/memories-library';
import { Memory } from '@/types';

export default function MemoriesPage() {
  const { user, loading } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      redirect('/auth/signin');
      return;
    }
    
    fetchMemories();
  }, [user, loading, searchQuery]);

  const fetchMemories = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      params.set('limit', '50');
      
      const response = await fetch(`/api/memories?${params}`);
      const data = await response.json();
      
      setMemories(data.memories || data.results || []);
      setTotal(data.total || data.memories?.length || 0);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemory = async (id: string, text: string) => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        setMemories(prev => 
          prev.map(memory => 
            memory.id === id ? { ...memory, text } : memory
          )
        );
      }
    } catch (error) {
      console.error('Error updating memory:', error);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMemories(prev => prev.filter(memory => memory.id !== id));
        setTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    redirect('/auth/signin');
    return null;
  }

  return (
    <MemoriesLibrary
      memories={memories}
      total={total}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onUpdateMemory={updateMemory}
      onDeleteMemory={deleteMemory}
      isLoading={isLoading}
    />
  );
}