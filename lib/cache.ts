import NodeCache from 'node-cache';

// Create cache instances with different TTLs for different operations
const searchCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes for search results
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
});

const memoriesCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes for all memories
  checkperiod: 120,
  useClones: false
});

const userCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes for user-specific data
  checkperiod: 300,
  useClones: false
});

export class CacheService {
  // Search results cache
  static getSearchResults(userId: string, query: string): any[] | undefined {
    const key = `search:${userId}:${query}`;
    const result = searchCache.get(key);
    return result === null ? undefined : result as any[];
  }

  static setSearchResults(userId: string, query: string, results: any[]): void {
    const key = `search:${userId}:${query}`;
    searchCache.set(key, results);
  }

  // All memories cache
  static getAllMemories(userId: string): any | undefined {
    const key = `memories:${userId}`;
    const result = memoriesCache.get(key);
    return result === null ? undefined : result;
  }

  static setAllMemories(userId: string, results: any): void {
    const key = `memories:${userId}`;
    memoriesCache.set(key, results);
  }

  // User-specific cache operations
  static getUserData(userId: string, type: string): any | undefined {
    const key = `user:${userId}:${type}`;
    return userCache.get(key);
  }

  static setUserData(userId: string, type: string, data: any): void {
    const key = `user:${userId}:${type}`;
    userCache.set(key, data);
  }

  // Cache invalidation methods
  static invalidateUserMemories(userId: string): void {
    // Remove all memories for this user
    const memoriesKey = `memories:${userId}`;
    memoriesCache.del(memoriesKey);

    // Remove all search results for this user
    const searchKeys = searchCache.keys();
    searchKeys.forEach(key => {
      if (key.startsWith(`search:${userId}:`)) {
        searchCache.del(key);
      }
    });

    // Remove user-specific data
    const userKeys = userCache.keys();
    userKeys.forEach(key => {
      if (key.startsWith(`user:${userId}:`)) {
        userCache.del(key);
      }
    });
  }

  static invalidateMemory(memoryId: string): void {
    // Find and remove all cache entries that might contain this memory
    const allKeys = [
      ...searchCache.keys(),
      ...memoriesCache.keys(),
      ...userCache.keys()
    ];

    allKeys.forEach(key => {
      const cached = searchCache.get(key) || memoriesCache.get(key) || userCache.get(key);
      if (cached && JSON.stringify(cached).includes(memoryId)) {
        searchCache.del(key);
        memoriesCache.del(key);
        userCache.del(key);
      }
    });
  }

  // Cache statistics
  static getStats(): {
    searchCache: { keys: number; hits: number; misses: number; };
    memoriesCache: { keys: number; hits: number; misses: number; };
    userCache: { keys: number; hits: number; misses: number; };
  } {
    return {
      searchCache: {
        keys: searchCache.keys().length,
        hits: (searchCache as any).getStats().hits,
        misses: (searchCache as any).getStats().misses,
      },
      memoriesCache: {
        keys: memoriesCache.keys().length,
        hits: (memoriesCache as any).getStats().hits,
        misses: (memoriesCache as any).getStats().misses,
      },
      userCache: {
        keys: userCache.keys().length,
        hits: (userCache as any).getStats().hits,
        misses: (userCache as any).getStats().misses,
      },
    };
  }

  // Clear all caches
  static clearAll(): void {
    searchCache.flushAll();
    memoriesCache.flushAll();
    userCache.flushAll();
  }
}

export default CacheService;
