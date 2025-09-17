'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Database } from 'lucide-react';

interface CacheStats {
  searchCache: { keys: number; hits: number; misses: number; };
  memoriesCache: { keys: number; hits: number; misses: number; };
  userCache: { keys: number; hits: number; misses: number; };
}

export function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cache/stats');
      const data = await response.json();
      setStats(data.cache);
      setLastUpdated(new Date());
    } catch (error) {
      // console.error('Failed to fetch cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      await fetch('/api/cache/stats', { method: 'DELETE' });
      await fetchStats(); // Refresh stats after clearing
    } catch (error) {
      // console.error('Failed to clear cache:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getHitRate = (hits: number, misses: number) => {
    const total = hits + misses;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
  };

  const getTotalKeys = () => {
    if (!stats) return 0;
    return stats.searchCache.keys + stats.memoriesCache.keys + stats.userCache.keys;
  };

  const getTotalHits = () => {
    if (!stats) return 0;
    return stats.searchCache.hits + stats.memoriesCache.hits + stats.userCache.hits;
  };

  const getTotalMisses = () => {
    if (!stats) return 0;
    return stats.searchCache.misses + stats.memoriesCache.misses + stats.userCache.misses;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache Monitor
            </CardTitle>
            <CardDescription>
              Monitor Mem0 cache performance and manage cache operations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchStats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={clearCache}
              disabled={loading}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{getTotalKeys()}</div>
                <div className="text-sm text-muted-foreground">Total Keys</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getTotalHits()}</div>
                <div className="text-sm text-muted-foreground">Cache Hits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getTotalMisses()}</div>
                <div className="text-sm text-muted-foreground">Cache Misses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getHitRate(getTotalHits(), getTotalMisses())}%
                </div>
                <div className="text-sm text-muted-foreground">Hit Rate</div>
              </div>
            </div>

            {/* Individual Cache Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Cache */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Search Cache</CardTitle>
                  <CardDescription>5min TTL</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Keys:</span>
                      <Badge variant="secondary">{stats.searchCache.keys}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hits:</span>
                      <Badge variant="outline" className="text-green-600">{stats.searchCache.hits}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Misses:</span>
                      <Badge variant="outline" className="text-red-600">{stats.searchCache.misses}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Rate:</span>
                      <Badge variant="outline" className="text-blue-600">
                        {getHitRate(stats.searchCache.hits, stats.searchCache.misses)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Memories Cache */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Memories Cache</CardTitle>
                  <CardDescription>10min TTL</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Keys:</span>
                      <Badge variant="secondary">{stats.memoriesCache.keys}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hits:</span>
                      <Badge variant="outline" className="text-green-600">{stats.memoriesCache.hits}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Misses:</span>
                      <Badge variant="outline" className="text-red-600">{stats.memoriesCache.misses}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Rate:</span>
                      <Badge variant="outline" className="text-blue-600">
                        {getHitRate(stats.memoriesCache.hits, stats.memoriesCache.misses)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Cache */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">User Cache</CardTitle>
                  <CardDescription>30min TTL</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Keys:</span>
                      <Badge variant="secondary">{stats.userCache.keys}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hits:</span>
                      <Badge variant="outline" className="text-green-600">{stats.userCache.hits}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Misses:</span>
                      <Badge variant="outline" className="text-red-600">{stats.userCache.misses}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Rate:</span>
                      <Badge variant="outline" className="text-blue-600">
                        {getHitRate(stats.userCache.hits, stats.userCache.misses)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {lastUpdated && (
              <div className="text-sm text-muted-foreground text-center">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading cache statistics...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
