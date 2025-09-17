'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, RotateCcw, Pencil, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { MemoryActivity, Memory, MemoryLink } from '@/types';

interface MessageActivityDetailsProps {
  activity: MemoryActivity;
  messageContent: string;
}

export function MessageActivityDetails({ activity, messageContent }: MessageActivityDetailsProps) {
  const [memoryDetails, setMemoryDetails] = useState<Record<string, Memory>>({});
  const [loadingMemories, setLoadingMemories] = useState<Set<string>>(new Set());
  const [restoringMemories, setRestoringMemories] = useState<Set<string>>(new Set());
  const [restoredMemories, setRestoredMemories] = useState<Set<string>>(new Set());

  const addedMemories = activity.details.filter(link => link.operation === 'add');
  const updatedMemories = activity.details.filter(link => link.operation === 'update');
  const deletedMemories = activity.details.filter(link => link.operation === 'delete');

  useEffect(() => {
    // Fetch memory details for all memory links
    const allMemoryIds = activity.details.map(link => link.mem0_id);
    fetchMemoryDetails(allMemoryIds);
  }, [activity.details]);

  const fetchMemoryDetails = async (memoryIds: string[]) => {
    for (const memoryId of memoryIds) {
      if (memoryDetails[memoryId]) continue; // Already fetched
      
      setLoadingMemories(prev => {
        const newSet = new Set(prev);
        newSet.add(memoryId);
        return newSet;
      });
      
      try {
        const response = await fetch(`/api/memories/${memoryId}`);
        if (response.ok) {
          const data = await response.json();
          setMemoryDetails(prev => ({
            ...prev,
            [memoryId]: data.memory
          }));
        }
      } catch (error) {
        // console.error(`Error fetching memory ${memoryId}:`, error);
      } finally {
        setLoadingMemories(prev => {
          const newSet = new Set(prev);
          newSet.delete(memoryId);
          return newSet;
        });
      }
    }
  };

  const restoreMemory = async (memoryId: string) => {
    setRestoringMemories(prev => {
      const newSet = new Set(prev);
      newSet.add(memoryId);
      return newSet;
    });

    try {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });

      if (response.ok) {
        setRestoredMemories(prev => {
          const newSet = new Set(prev);
          newSet.add(memoryId);
          return newSet;
        });
      } else {
        // console.error('Failed to restore memory');
      }
    } catch (error) {
      // console.error('Error restoring memory:', error);
    } finally {
      setRestoringMemories(prev => {
        const newSet = new Set(prev);
        newSet.delete(memoryId);
        return newSet;
      });
    }
  };

  const createDiffView = (oldText: string, newText: string) => {
    // Simple word-level diff for inline display
    const oldWords = oldText.split(' ');
    const newWords = newText.split(' ');
    
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-red-600">Before:</div>
        <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
          {oldText}
        </div>
        <div className="text-xs font-medium text-green-600">After:</div>
        <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm">
          {newText}
        </div>
      </div>
    );
  };

  const MemoryCard = ({ link, type }: { link: MemoryLink, type: 'add' | 'update' | 'delete' }) => {
    const memory = memoryDetails[link.mem0_id];
    const isLoading = loadingMemories.has(link.mem0_id);
    const isRestoring = restoringMemories.has(link.mem0_id);
    const isRestored = restoredMemories.has(link.mem0_id);
    
    const bgColor = type === 'add' ? 'bg-green-50 dark:bg-green-950/20' : 
                   type === 'update' ? 'bg-yellow-50 dark:bg-yellow-950/20' : 
                   'bg-red-50 dark:bg-red-950/20';
    
    const textColor = type === 'add' ? 'text-green-600' : 
                     type === 'update' ? 'text-yellow-600' : 
                     'text-red-600';

    if (type === 'delete') {
      // Ghost card for deleted memories
      return (
        <div className={`p-3 border-2 border-dashed rounded-md ${bgColor} ${isRestored ? 'opacity-50' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isRestored ? (
                <Alert className="mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Memory has been restored successfully!
                  </AlertDescription>
                </Alert>
              ) : null}
              
              <div className={isRestored ? 'opacity-50' : ''}>
                <p className="text-sm font-medium mb-2 line-through">
                  {link.old_content || `Memory ID: ${link.mem0_id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Deleted {new Date(link.created_at).toLocaleString()}
                </p>
                {!link.old_content && (
                  <div className="text-xs text-muted-foreground mt-1 p-2 bg-gray-100 rounded">
                    Content not available for restoration
                  </div>
                )}
              </div>
              
              {!isRestored && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => restoreMemory(link.mem0_id)}
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Undo Delete
                    </>
                  )}
                </Button>
              )}
            </div>
            <Badge variant="destructive" className="text-xs">
              Deleted
            </Badge>
          </div>
        </div>
      );
    }

    if (type === 'update') {
      // Show diff for updated memories
      return (
        <div className={`p-3 border rounded-md ${bgColor}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Pencil className="w-3 h-3" />
                <span className="text-xs font-medium">Memory Updated</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ID: {link.mem0_id} • {new Date(link.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-600">
              Modified
            </Badge>
          </div>
          
          {link.old_content && link.new_content ? (
            createDiffView(link.old_content, link.new_content)
          ) : (
            <div>
              <p className="text-sm font-medium mb-2">{memory?.text || 'Updated memory content'}</p>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-gray-100 rounded">
                <div>Old: "{link.old_content || 'Not available'}"</div>
                <div>New: "{link.new_content || 'Not available'}"</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default card for added memories
    return (
      <div className={`p-3 border rounded-md ${bgColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <p className="text-sm">Loading memory details...</p>
              </div>
            ) : memory ? (
              <div>
                <p className="text-sm font-medium mb-2">{memory.text}</p>
                <p className="text-xs text-muted-foreground">
                  ID: {link.mem0_id} • {new Date(link.created_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Memory ID: {link.mem0_id}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created {new Date(link.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs border-green-200 text-green-600">
            New
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Memory Activity</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Memory changes from: "{messageContent.substring(0, 100)}{messageContent.length > 100 ? '...' : ''}"
        </p>
        
        <div className="flex gap-4 mb-6">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Plus className="w-3 h-3 mr-1" />
            {activity.added} Added
          </Badge>
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            <Pencil className="w-3 h-3 mr-1" />
            {activity.updated} Updated
          </Badge>
          <Badge variant="outline" className="text-red-600 border-red-200">
            <Trash2 className="w-3 h-3 mr-1" />
            {activity.deleted} Deleted
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4">
          {addedMemories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-600">Added Memories</CardTitle>
                <CardDescription>New memories created from this message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {addedMemories.map((link) => (
                  <MemoryCard key={link.id} link={link} type="add" />
                ))}
              </CardContent>
            </Card>
          )}

          {updatedMemories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-yellow-600">Updated Memories</CardTitle>
                <CardDescription>Existing memories that were modified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {updatedMemories.map((link) => (
                  <MemoryCard key={link.id} link={link} type="update" />
                ))}
              </CardContent>
            </Card>
          )}

          {deletedMemories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-600">Deleted Memories</CardTitle>
                <CardDescription>Memories that were removed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {deletedMemories.map((link) => (
                  <MemoryCard key={link.id} link={link} type="delete" />
                ))}
              </CardContent>
            </Card>
          )}

          {activity.details.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No memory activity detected yet.</p>
              <p className="text-xs">Memory extraction may still be in progress.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}