'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Brain, 
  Edit2, 
  Trash2, 
  Calendar, 
  Tag, 
  ArrowLeft,
  Filter
} from 'lucide-react';
import { Memory } from '@/types';
import Link from 'next/link';

interface MemoriesLibraryProps {
  memories: Memory[];
  total: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUpdateMemory: (id: string, text: string) => void;
  onDeleteMemory: (id: string) => void;
}

export function MemoriesLibrary({
  memories,
  total,
  searchQuery,
  onSearchChange,
  onUpdateMemory,
  onDeleteMemory,
}: MemoriesLibraryProps) {
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editText, setEditText] = useState('');

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setEditText(memory.text);
  };

  const handleSaveEdit = async () => {
    if (editingMemory && editText.trim()) {
      await onUpdateMemory(editingMemory.id, editText.trim());
      setEditingMemory(null);
      setEditText('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Chat
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  Memories Library
                </h1>
                <p className="text-muted-foreground">
                  Browse and manage your AI's memories ({total} total)
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search memories..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memories.map((memory) => (
            <Card key={memory.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium line-clamp-3 flex-1">
                    {memory.text}
                  </CardTitle>
                  <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(memory)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteMemory(memory.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(memory.created_at)}</span>
                  </div>
                  {memory.updated_at !== memory.created_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Edit2 className="h-3 w-3" />
                      <span>Updated {formatDate(memory.updated_at)}</span>
                    </div>
                  )}
                  {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(memory.metadata).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      ID: {memory.id.substring(0, 8)}...
                    </Badge>
                    {memory.score && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(memory.score * 100)}% match
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {memories.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            {searchQuery ? (
              <>
                <h3 className="text-lg font-medium mb-2">No memories found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No memories yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start chatting to create your first memories
                </p>
                <Link href="/chat">
                  <Button>
                    Start Chatting
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!editingMemory} onOpenChange={() => setEditingMemory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Memory Text</label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMemory(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}