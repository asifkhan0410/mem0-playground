import CacheService from './cache';

// Type definitions
interface Mem0Memory {
  id: string;
  memory?: string;
  hash?: string;
  metadata?: Record<string, any>;
  score?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// Lazy import and initialization to avoid server-side issues
let MemoryClient: any = null;
let client: any = null;

async function getClient(): Promise<any> {
  // Only initialize on server-side
  if (typeof window !== 'undefined') {
    console.warn('Mem0 client cannot be initialized on client-side');
    return null;
  }

  if (!client && process.env.MEM0_API_KEY) {
    try {
      // Dynamic import to avoid server-side issues
      if (!MemoryClient) {
        const mem0Module = await import('mem0ai');
        MemoryClient = mem0Module.MemoryClient;
      }

      client = new MemoryClient({
        apiKey: process.env.MEM0_API_KEY,
        projectId: process.env.MEM0_PROJECT_ID,
      });
      
      console.log('Mem0 client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mem0 client:', error);
      return null;
    }
  }
  return client;
}

export interface Memory {
  id: string;
  text: string;
  hash: string;
  metadata: Record<string, any>;
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface MemorySearchResult {
  results: Memory[];
  total: number;
}

export class Mem0Service {
  static async addMemory(userId: string, text: string, metadata?: Record<string, any>): Promise<string[]> {
    const mem0Client = await getClient();
    if (!mem0Client) {
      console.warn('MEM0 client not initialized - API key missing or server-side issue');
      return [];
    }
    
    try {
      const result = await mem0Client.add(text, {
        user_id: userId,
        metadata: metadata || {},
      });
      
      const memoryIds = result?.map((r: any) => r.id) || [];
      
      // Invalidate user's cache since new memories were added
      if (memoryIds.length > 0) {
        CacheService.invalidateUserMemories(userId);
        console.log(`Invalidated cache for user ${userId} after adding ${memoryIds.length} memories`);
      }
      
      return memoryIds;
    } catch (error) {
      console.error('Error adding memory:', error);
      throw new Error('Failed to add memory');
    }
  }

  static async searchMemories(userId: string, query: string, limit = 5): Promise<Memory[]> {
    // Check cache first
    const cacheKey = `${query}:${limit}`;
    const cachedResults = CacheService.getSearchResults(userId, cacheKey);
    if (cachedResults) {
      console.log(`Cache hit for search: ${query}`);
      return cachedResults;
    }

    const mem0Client = await getClient();
    if (!mem0Client) {
      console.warn('MEM0 client not initialized - API key missing or server-side issue');
      return [];
    }
    
    try {
      const result = await mem0Client.search(query, {
        user_id: userId,
        limit,
      });
      
      const mappedResults = (result || []).map((mem: Mem0Memory) => ({
        id: mem.id,
        text: mem.memory || '',
        hash: mem.hash || '',
        metadata: mem.metadata || {},
        score: mem.score,
        created_at: typeof mem.created_at === 'string' ? mem.created_at : (mem.created_at || new Date()).toISOString(),
        updated_at: typeof mem.updated_at === 'string' ? mem.updated_at : (mem.updated_at || new Date()).toISOString(),
      }));

      // Cache the results
      CacheService.setSearchResults(userId, cacheKey, mappedResults);
      console.log(`Cached search results for: ${query}`);
      
      return mappedResults;
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }

  static async getMemoryById(userId: string, memoryId: string): Promise<Memory | null> {
    const mem0Client = await getClient();
    if (!mem0Client) {
      console.warn('MEM0 client not initialized - API key missing or server-side issue');
      return null;
    }
    
    try {
      const result = await mem0Client.get(memoryId, {
        user_id: userId,
      });
      
      if (!result) {
        return null;
      }

      return {
        id: result.id,
        text: result.memory || '',
        hash: result.hash || '',
        metadata: result.metadata || {},
        score: result.score,
        created_at: typeof result.created_at === 'string' ? result.created_at : (result.created_at || new Date()).toISOString(),
        updated_at: typeof result.updated_at === 'string' ? result.updated_at : (result.updated_at || new Date()).toISOString(),
      };
    } catch (error) {
      console.error('Error fetching memory by ID:', error);
      return null;
    }
  }

  static async getAllMemories(userId: string, limit = 50, offset = 0): Promise<MemorySearchResult> {
    // Check cache first
    const cachedResults = CacheService.getAllMemories(userId);
    if (cachedResults) {
      console.log(`Cache hit for all memories for user: ${userId}`);
      return cachedResults;
    }

    const mem0Client = await getClient();
    if (!mem0Client) {
      console.warn('MEM0 client not initialized - API key missing or server-side issue');
      return { results: [], total: 0 };
    }
    
    try {
      const result = await mem0Client.getAll({
        user_id: userId,
        limit,
      });
      
      const mappedResults = (result || []).map((mem: Mem0Memory) => ({
        id: mem.id,
        text: mem.memory || '',
        hash: mem.hash || '',
        metadata: mem.metadata || {},
        score: mem.score,
        created_at: typeof mem.created_at === 'string' ? mem.created_at : (mem.created_at || new Date()).toISOString(),
        updated_at: typeof mem.updated_at === 'string' ? mem.updated_at : (mem.updated_at || new Date()).toISOString(),
      }));
      
      const searchResult = {
        results: mappedResults,
        total: mappedResults.length,
      };

      // Cache the results
      CacheService.setAllMemories(userId, searchResult);
      console.log(`Cached all memories for user: ${userId}`);
      
      return searchResult;
    } catch (error) {
      console.error('Error getting all memories:', error);
      return { results: [], total: 0 };
    }
  }

  static async updateMemory(memoryId: string, text: string, userId?: string): Promise<boolean> {
    const mem0Client = await getClient();
    if (!mem0Client) {
      console.warn('MEM0 client not initialized - API key missing or server-side issue');
      return false;
    }
    
    try {
      await mem0Client.update(memoryId, text, {
        user_id: userId,
      });
      
      // Invalidate cache for this specific memory
      CacheService.invalidateMemory(memoryId);
      console.log(`Invalidated cache for updated memory: ${memoryId}`);
      
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      return false;
    }
  }

  static async deleteMemory(memoryId: string, userId?: string): Promise<boolean> {
    const mem0Client = await getClient();
    if (!mem0Client) {
      console.warn('MEM0 client not initialized - API key missing or server-side issue');
      return false;
    }
    
    try {
      await mem0Client.delete(memoryId, {
        user_id: userId,
      });
      
      // Invalidate cache for this specific memory
      CacheService.invalidateMemory(memoryId);
      console.log(`Invalidated cache for deleted memory: ${memoryId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      return false;
    }
  }
}

export default Mem0Service;