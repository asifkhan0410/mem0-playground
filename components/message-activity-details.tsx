'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, Pencil, Trash2, Loader2 } from 'lucide-react';
import { MemoryActivity, Memory } from '@/types';

interface MessageActivityDetailsProps {
  activity: MemoryActivity;
  messageContent: string;
}

export function MessageActivityDetails({ activity, messageContent }: MessageActivityDetailsProps) {
  const [memoryDetails, setMemoryDetails] = useState<Record<string, Memory>>({});
  const [loadingMemories, setLoadingMemories] = useState<Set<string>>(new Set());

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
        console.error(`Error fetching memory ${memoryId}:`, error);
      } finally {
        setLoadingMemories(prev => {
          const newSet = new Set(prev);
          newSet.delete(memoryId);
          return newSet;
        });
      }
    }
  };

  const MemoryCard = ({ link, type }: { link: any, type: 'add' | 'update' | 'delete' }) => {
    const memory = memoryDetails[link.mem0_id];
    const isLoading = loadingMemories.has(link.mem0_id);
    
    const bgColor = type === 'add' ? 'bg-green-50 dark:bg-green-950/20' : 
                   type === 'update' ? 'bg-yellow-50 dark:bg-yellow-950/20' : 
                   'bg-red-50 dark:bg-red-950/20';
    
    const textColor = type === 'add' ? 'text-green-600' : 
                     type === 'update' ? 'text-yellow-600' : 
                     'text-red-600';

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
          <Badge variant="secondary" className="text-xs">
            {type === 'add' ? 'New' : type === 'update' ? 'Modified' : 'Removed'}
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