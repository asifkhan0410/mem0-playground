"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Brain,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { Memory } from "@/types";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { ShimmerCard } from "@/components/shimmer";

interface MemoriesLibraryProps {
  memories: Memory[];
  total: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUpdateMemory: (id: string, text: string) => void;
  onDeleteMemory: (id: string) => void;
  isLoading?: boolean;
}

export function MemoriesLibrary({
  memories,
  total,
  searchQuery,
  onSearchChange,
  onUpdateMemory,
  onDeleteMemory,
  isLoading = false,
}: MemoriesLibraryProps) {
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editText, setEditText] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null);

  // Debounce search query
  const debouncedLocalSearchQuery = useDebounce(localSearchQuery, 100);

  useEffect(() => {
    if (debouncedLocalSearchQuery !== searchQuery) {
      onSearchChange(debouncedLocalSearchQuery);
    }
  }, [debouncedLocalSearchQuery, searchQuery, onSearchChange]);

  // Update local search query when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setEditText(memory.text);
  };

  const handleSaveEdit = async () => {
    if (editingMemory && editText.trim() && !isUpdating) {
      setIsUpdating(true);
      try {
        await onUpdateMemory(editingMemory.id, editText.trim());
        setEditingMemory(null);
        setEditText("");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDeleteClick = (memory: Memory) => {
    setDeletingMemory(memory);
  };

  const handleDeleteConfirm = async () => {
    if (deletingMemory && !isDeleting) {
      setIsDeleting(deletingMemory.id);
      try {
        await onDeleteMemory(deletingMemory.id);
        setDeletingMemory(null);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="relative">
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ShimmerCard key={`shimmer-${index}`} />
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memories.map((memory) => (
              <Card
                key={memory.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <CardHeader className="p-4">
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
                         onClick={() => handleDeleteClick(memory)}
                         disabled={isDeleting === memory.id}
                         className="text-destructive hover:text-destructive"
                       >
                         {isDeleting === memory.id ? (
                           <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                         ) : (
                           <Trash2 className="h-3 w-3" />
                         )}
                       </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-0 pb-4">
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
                    <div className="flex items-center justify-between pt-4">
                      <Badge variant="outline" className="text-xs">
                        Id: {memory.id.substring(0, 16)}...
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
        </div>

        {!isLoading && memories.length === 0 && (
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
                  <Button>Start Chatting</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={!!editingMemory}
        onOpenChange={() => setEditingMemory(null)}
      >
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
              <Button 
                variant="outline" 
                onClick={() => setEditingMemory(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={isUpdating || !editText.trim()}
              >
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingMemory}
        onOpenChange={() => setDeletingMemory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this memory? This action cannot be undone.
              </p>
              {deletingMemory && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm line-clamp-3">{deletingMemory.text}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeletingMemory(null)}
                disabled={!!isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteConfirm} 
                disabled={!!isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Memory'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
