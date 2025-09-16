'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Brain, Calendar, Tag } from 'lucide-react';
import { Memory } from '@/types';

interface MemoriesPanelProps {
  conversationId?: string;
}

export function MemoriesPanel({ conversationId }: MemoriesPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, [searchQuery]);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      params.set('limit', '20');
      
      const response = await fetch(`/api/memories?${params}`);
      const data = await response.json();
      
      setMemories(data.memories || data.results || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col border-l bg-muted/10">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5" />
          <h2 className="font-semibold">Memories</h2>
          <Badge variant="secondary" className="ml-auto">
            {memories.length}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted rounded-md"></div>
                </div>
              ))}
            </div>
          ) : memories.length > 0 ? (
            memories.map((memory) => (
              <Card key={memory.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {memory.text}
                    </CardTitle>
                    {memory.score && (
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {Math.round(memory.score * 100)}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(memory.created_at)}
                    </div>
                    {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>Tagged</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium mb-1">No memories found</p>
                  <p className="text-xs">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">No memories yet</p>
                  <p className="text-xs">Start chatting to create memories</p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}