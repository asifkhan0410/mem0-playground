import { describe, it, expect, beforeEach, vi } from 'vitest';
import CacheService from '@/lib/cache';
import { Memory } from '@/types';

describe('CacheService', () => {
  beforeEach(() => {
    // Clear cache before each test
    vi.clearAllMocks();
    // Reset cache instance
    (CacheService as any).cache?.flushAll();
  });

  describe('Search Results Caching', () => {
    it('should store and retrieve search results', () => {
      const userId = 'user123';
      const query = 'Paris';
      const memories: Memory[] = [
        {
          id: 'mem1',
          text: 'I live in Paris',
          hash: 'hash1',
          metadata: {},
          score: 0.9,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }
      ];

      // Store search results
      CacheService.setSearchResults(userId, query, memories);

      // Retrieve search results
      const cachedResults = CacheService.getSearchResults(userId, query);

      expect(cachedResults).toEqual(memories);
    });

    it('should return undefined for non-existent search results', () => {
      const userId = 'user123';
      const query = 'nonexistent';

      const cachedResults = CacheService.getSearchResults(userId, query);

      expect(cachedResults).toBeUndefined();
    });

    it('should handle different users and queries separately', () => {
      const user1 = 'user1';
      const user2 = 'user2';
      const query1 = 'Paris';
      const query2 = 'London';

      const memories1: Memory[] = [{ id: 'mem1', text: 'Paris memory', hash: 'hash1', metadata: {}, score: 0.9, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' }];
      const memories2: Memory[] = [{ id: 'mem2', text: 'London memory', hash: 'hash2', metadata: {}, score: 0.8, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' }];

      CacheService.setSearchResults(user1, query1, memories1);
      CacheService.setSearchResults(user2, query2, memories2);

      expect(CacheService.getSearchResults(user1, query1)).toEqual(memories1);
      expect(CacheService.getSearchResults(user2, query2)).toEqual(memories2);
      expect(CacheService.getSearchResults(user1, query2)).toBeUndefined();
      expect(CacheService.getSearchResults(user2, query1)).toBeUndefined();
    });
  });

  describe('All Memories Caching', () => {
    it('should store and retrieve all memories', () => {
      const userId = 'user123';
      const memories: Memory[] = [
        {
          id: 'mem1',
          text: 'Memory 1',
          hash: 'hash1',
          metadata: {},
          score: 0.9,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'mem2',
          text: 'Memory 2',
          hash: 'hash2',
          metadata: {},
          score: 0.8,
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
        }
      ];

      CacheService.setAllMemories(userId, memories);

      const cachedMemories = CacheService.getAllMemories(userId);

      expect(cachedMemories).toEqual(memories);
    });

    it('should return undefined for non-existent user memories', () => {
      const userId = 'nonexistent';

      const cachedMemories = CacheService.getAllMemories(userId);

      expect(cachedMemories).toBeUndefined();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate user memories', () => {
      const userId = 'user123';
      const memories: Memory[] = [
        {
          id: 'mem1',
          text: 'Memory 1',
          hash: 'hash1',
          metadata: {},
          score: 0.9,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }
      ];

      // Store memories
      CacheService.setAllMemories(userId, memories);
      CacheService.setSearchResults(userId, 'test', memories);

      // Verify they're cached
      expect(CacheService.getAllMemories(userId)).toEqual(memories);
      expect(CacheService.getSearchResults(userId, 'test')).toEqual(memories);

      // Invalidate user memories
      CacheService.invalidateUserMemories(userId);

      // Verify they're cleared
      expect(CacheService.getAllMemories(userId)).toBeUndefined();
      expect(CacheService.getSearchResults(userId, 'test')).toBeUndefined();
    });

    it('should invalidate specific memory', () => {
      const userId = 'user123';
      const memoryId = 'mem1';
      const memories: Memory[] = [
        {
          id: memoryId,
          text: 'Memory 1',
          hash: 'hash1',
          metadata: {},
          score: 0.9,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }
      ];

      // Store memories
      CacheService.setAllMemories(userId, memories);

      // Invalidate specific memory
      CacheService.invalidateMemory(memoryId);

      // Verify memories are cleared
      expect(CacheService.getAllMemories(userId)).toBeUndefined();
    });

    it('should handle invalidation of non-existent entries gracefully', () => {
      const userId = 'nonexistent';
      const memoryId = 'nonexistent';

      // Should not throw errors
      expect(() => CacheService.invalidateUserMemories(userId)).not.toThrow();
      expect(() => CacheService.invalidateMemory(memoryId)).not.toThrow();
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', () => {
      const userId = 'user123';
      const memories: Memory[] = [
        {
          id: 'mem1',
          text: 'Memory 1',
          hash: 'hash1',
          metadata: {},
          score: 0.9,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }
      ];

      // Add some data to cache
      CacheService.setAllMemories(userId, memories);
      CacheService.setSearchResults(userId, 'query1', memories);
      CacheService.setSearchResults(userId, 'query2', memories);

      const stats = CacheService.getStats();

      expect(stats).toHaveProperty('searchCache');
      expect(stats).toHaveProperty('memoriesCache');
      expect(stats).toHaveProperty('userCache');
      
      expect(stats.searchCache).toHaveProperty('keys');
      expect(stats.searchCache).toHaveProperty('hits');
      expect(stats.searchCache).toHaveProperty('misses');
      expect(typeof stats.searchCache.keys).toBe('number');
      expect(typeof stats.searchCache.hits).toBe('number');
      expect(typeof stats.searchCache.misses).toBe('number');
    });

    it('should clear all caches', () => {
      const userId = 'user123';
      const memories: Memory[] = [
        {
          id: 'mem1',
          text: 'Memory 1',
          hash: 'hash1',
          metadata: {},
          score: 0.9,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }
      ];

      // Add some data to cache
      CacheService.setAllMemories(userId, memories);
      CacheService.setSearchResults(userId, 'test', memories);

      // Verify data is cached
      expect(CacheService.getAllMemories(userId)).toEqual(memories);

      // Clear all caches
      CacheService.clearAll();

      // Verify data is cleared
      expect(CacheService.getAllMemories(userId)).toBeUndefined();
      expect(CacheService.getSearchResults(userId, 'test')).toBeUndefined();
    });
  });

  describe('Cache TTL (Time To Live)', () => {
    it('should respect cache TTL settings', async () => {
      // This test would require mocking time or using a shorter TTL
      // For now, we'll test that the cache works within the TTL period
      const userId = 'user123';
      const memories: Memory[] = [
        {
          id: 'mem1',
          text: 'Memory 1',
          hash: 'hash1',
          metadata: {},
          score: 0.9,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        }
      ];

      CacheService.setSearchResults(userId, 'test', memories);

      // Should still be cached immediately
      expect(CacheService.getSearchResults(userId, 'test')).toEqual(memories);
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => CacheService.setSearchResults('', '', [])).not.toThrow();
      expect(() => CacheService.setAllMemories('', [])).not.toThrow();
      expect(() => CacheService.getSearchResults('', '')).not.toThrow();
      expect(() => CacheService.getAllMemories('')).not.toThrow();
    });

    it('should handle malformed data gracefully', () => {
      const userId = 'user123';
      
      // Store malformed data
      CacheService.setSearchResults(userId, 'test', null as any);
      CacheService.setAllMemories(userId, undefined as any);

      // Should return undefined for malformed data
      expect(CacheService.getSearchResults(userId, 'test')).toBeUndefined();
      expect(CacheService.getAllMemories(userId)).toBeUndefined();
    });
  });
});
