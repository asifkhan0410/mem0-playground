'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { Shimmer } from '@/components/shimmer';

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
      // console.error('Error fetching referenced memories:', error);
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

  if (!isVisible) {
    return null;
  }

  if (memories.length === 0 && !isLoading) {
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
            <Shimmer key={i} className="rounded-lg">
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-4 bg-muted rounded w-8"></div>
                    <div className="h-4 w-4 bg-muted rounded"></div>
                  </div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            </Shimmer>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {memories.map((memory) => (
            <Card key={memory.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-3">
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium ${
                      memory.score >= 0.7
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                        : memory.score >= 0.4 
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                        : memory.score >= 0.2 
                        ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    }`}
                  >
                    {memory.score.toFixed(2)}
                  </Badge>
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full text-xs flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                    {memory.index}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
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
