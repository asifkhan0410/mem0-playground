"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Brain, Calendar, Tag, RefreshCw } from "lucide-react";
import { Memory } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";
import { Shimmer } from "@/components/shimmer";

interface MemoriesPanelProps {
  conversationId?: string;
  onMemoryActivity?: (activity: {
    added: number;
    updated: number;
    deleted: number;
  }) => void;
  refreshTrigger?: number; // A number that changes when memories should be refreshed
}

export function MemoriesPanel({
  conversationId,
  onMemoryActivity,
  refreshTrigger,
}: MemoriesPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newMemoriesCount, setNewMemoriesCount] = useState(0);
  const [newMemoryIds, setNewMemoryIds] = useState<Set<string>>(new Set());

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 100);

  useEffect(() => {
    fetchMemories();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchMemories();
    }
  }, [refreshTrigger]);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.set("query", debouncedSearchQuery);
      params.set("limit", "20");

      const response = await fetch(`/api/memories?${params}`);
      const data = await response.json();

      const newMemories = data.memories || data.results || [];

      // Track if we have new memories
      if (memories.length > 0 && newMemories.length > memories.length) {
        const addedCount = newMemories.length - memories.length;
        setNewMemoriesCount(addedCount);

        // Find new memory IDs
        const existingIds = new Set(memories.map((m: Memory) => m.id));
        const newIds = newMemories.filter(
          (m: Memory) => !existingIds.has(m.id)
        );
        setNewMemoryIds(new Set(newIds.map((m: Memory) => m.id)));

        // Notify parent component about memory activity
        if (onMemoryActivity) {
          onMemoryActivity({ added: addedCount, updated: 0, deleted: 0 });
        }

        // Clear the new memories indicators after a delay
        setTimeout(() => {
          setNewMemoriesCount(0);
          setNewMemoryIds(new Set());
        }, 5000);
      }

      setMemories(newMemories);
    } catch (error) {
      console.error("Error fetching memories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col border-l bg-muted/10">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5" />
          <h2 className="font-semibold">Memories</h2>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMemories}
              disabled={isLoading}
              className="h-6 w-6 p-0"
              aria-label="Refresh memories"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            {newMemoriesCount > 0 && (
              <Badge variant="default" className="animate-pulse">
                +{newMemoriesCount} new
              </Badge>
            )}
            <Badge variant="secondary">{memories.length}</Badge>
          </div>
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
          {isLoading && memories.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Shimmer key={i} className="rounded-lg">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                </Shimmer>
              ))}
            </div>
          ) : memories.length > 0 ? (
            memories.map((memory) => (
              <Card
                key={memory.id}
                className={`group hover:shadow-md transition-all duration-300 ${
                  newMemoryIds.has(memory.id)
                    ? "ring-2 ring-primary/20 bg-primary/5 animate-pulse"
                    : ""
                }`}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {memory.text}
                    </CardTitle>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {newMemoryIds.has(memory.id) && (
                        <Badge
                          variant="default"
                          className="text-xs animate-bounce"
                        >
                          NEW
                        </Badge>
                      )}
                      {memory.score && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(memory.score * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(memory.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : !isLoading ? (
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
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
