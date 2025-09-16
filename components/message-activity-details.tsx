'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { MemoryActivity } from '@/types';

interface MessageActivityDetailsProps {
  activity: MemoryActivity;
  messageContent: string;
}

export function MessageActivityDetails({ activity, messageContent }: MessageActivityDetailsProps) {
  const addedMemories = activity.details.filter(link => link.operation === 'add');
  const updatedMemories = activity.details.filter(link => link.operation === 'update');
  const deletedMemories = activity.details.filter(link => link.operation === 'delete');

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
                  <div key={link.id} className="p-3 border rounded-md bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Memory ID: {link.mem0_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(link.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    </div>
                  </div>
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
                  <div key={link.id} className="p-3 border rounded-md bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Memory ID: {link.mem0_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {new Date(link.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Modified
                      </Badge>
                    </div>
                  </div>
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
                  <div key={link.id} className="p-3 border rounded-md bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium opacity-60">Memory ID: {link.mem0_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deleted {new Date(link.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs opacity-60">
                          Removed
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-xs h-6 px-2">
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Undo
                        </Button>
                      </div>
                    </div>
                  </div>
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