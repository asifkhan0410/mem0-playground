'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReferencedMemory {
  id: string;
  text: string;
  score: number;
  index: number;
  metadata: Record<string, any>;
}

interface RelevantMemoriesProps {
  messageId: string;
  onClose?: () => void;
}

export function RelevantMemories({ messageId, onClose }: RelevantMemoriesProps) {
  const [memories, setMemories] = useState<ReferencedMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchMemories();
  }, [messageId]);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages/${messageId}/memories`);
      const data = await response.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Error fetching referenced memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible || memories.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-2 bg-muted/20 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <h3 className="font-medium text-sm">Relevant Memories</h3>
        </div>
        {/* {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )} */}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 bg-muted rounded w-8"></div>
                  <div className="h-4 w-4 bg-muted rounded"></div>
                </div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {memories.map((memory) => (
            <Card key={memory.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-2">
                <div className="flex justify-between items-start mb-4">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {memory.score.toFixed(2)}
                  </Badge>
                  <div className="w-5 h-5 bg-muted rounded-full text-xs flex items-center justify-center text-gray-500">
                    {memory.index}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">
                  {memory.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
