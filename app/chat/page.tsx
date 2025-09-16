'use client';

import { useAuth } from '@/components/auth-provider';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChatLayout } from '@/components/chat-layout';
import { Conversation } from '@/types';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      redirect('/auth/signin');
      return;
    }
    
    fetchConversations();
  }, [user, loading]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
      
      // Select first conversation if none selected
      if (data.conversations?.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (title?: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      
      if (data.conversation) {
        setConversations(prev => [data.conversation, ...prev]);
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const updateConversation = async (id: string, title: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      
      if (data.conversation) {
        setConversations(prev => 
          prev.map(conv => conv.id === id ? data.conversation : conv)
        );
        if (selectedConversation?.id === id) {
          setSelectedConversation(data.conversation);
        }
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        if (selectedConversation?.id === id) {
          const remaining = conversations.filter(conv => conv.id !== id);
          setSelectedConversation(remaining.length > 0 ? remaining[0] : null);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    redirect('/auth/signin');
    return null;
  }

  return (
    <ChatLayout
      conversations={conversations}
      selectedConversation={selectedConversation}
      onSelectConversation={setSelectedConversation}
      onCreateConversation={createConversation}
      onUpdateConversation={updateConversation}
      onDeleteConversation={deleteConversation}
    />
  );
}