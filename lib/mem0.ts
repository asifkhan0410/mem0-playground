import CacheService from "./cache";
import db from "./database";

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
  if (typeof window !== "undefined") {
    return null;
  }

  if (!client && process.env.MEM0_API_KEY) {
    try {
      // Dynamic import to avoid server-side issues
      if (!MemoryClient) {
        const mem0Module = await import("mem0ai");
        MemoryClient = mem0Module.MemoryClient;
      }

      client = new MemoryClient({
        apiKey: process.env.MEM0_API_KEY,
        projectId: process.env.MEM0_PROJECT_ID,
      });
    } catch (error) {
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
  static async addMemory(
    userId: string,
    text: string,
    metadata?: Record<string, any>
  ): Promise<string[]> {
    const mem0Client = await getClient();
    if (!mem0Client) {
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
      }

      return memoryIds;
    } catch (error) {
      throw new Error("Failed to add memory");
    }
  }

  static async searchMemories(
    userId: string,
    query: string,
    limit = 5
  ): Promise<Memory[]> {
    // Check cache first
    const cacheKey = `${query}:${limit}`;
    const cachedResults = CacheService.getSearchResults(userId, cacheKey);
    if (cachedResults) {
      // Filter out deleted memories from cached results
      const filtered = this.filterDeletedMemories(cachedResults, userId);
      return filtered;
    }

    const mem0Client = await getClient();
    if (!mem0Client) {
      return [];
    }

    try {
      const result = await mem0Client.search(query, {
        user_id: userId,
        limit,
      });

      const mappedResults = (result || []).map((mem: Mem0Memory) => ({
        id: mem.id,
        text: mem.memory || "",
        hash: mem.hash || "",
        metadata: mem.metadata || {},
        score: mem.score,
        created_at:
          typeof mem.created_at === "string"
            ? mem.created_at
            : (mem.created_at || new Date()).toISOString(),
        updated_at:
          typeof mem.updated_at === "string"
            ? mem.updated_at
            : (mem.updated_at || new Date()).toISOString(),
      }));

      // Filter out deleted memories before caching
      const filteredResults = this.filterDeletedMemories(mappedResults, userId);

      // Cache the filtered results
      CacheService.setSearchResults(userId, cacheKey, filteredResults);

      return filteredResults;
    } catch (error) {
      return [];
    }
  }

  static async getMemoryById(
    userId: string,
    memoryId: string
  ): Promise<Memory | null> {
    const mem0Client = await getClient();
    if (!mem0Client) {
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
        text: result.memory || "",
        hash: result.hash || "",
        metadata: result.metadata || {},
        score: result.score,
        created_at:
          typeof result.created_at === "string"
            ? result.created_at
            : (result.created_at || new Date()).toISOString(),
        updated_at:
          typeof result.updated_at === "string"
            ? result.updated_at
            : (result.updated_at || new Date()).toISOString(),
      };
    } catch (error) {
      return null;
    }
  }

  static async getAllMemories(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<MemorySearchResult> {
    // Check cache first
    const cachedResults = CacheService.getAllMemories(userId);
    if (cachedResults) {
      // Filter out deleted memories from cached results
      const filteredResults = this.filterDeletedMemories(
        cachedResults.results,
        userId
      );
      return {
        results: filteredResults,
        total: filteredResults.length,
      };
    }

    const mem0Client = await getClient();
    if (!mem0Client) {
      return { results: [], total: 0 };
    }

    try {
      const result = await mem0Client.getAll({
        user_id: userId,
        limit,
      });

      const mappedResults = (result || []).map((mem: Mem0Memory) => ({
        id: mem.id,
        text: mem.memory || "",
        hash: mem.hash || "",
        metadata: mem.metadata || {},
        score: mem.score,
        created_at:
          typeof mem.created_at === "string"
            ? mem.created_at
            : (mem.created_at || new Date()).toISOString(),
        updated_at:
          typeof mem.updated_at === "string"
            ? mem.updated_at
            : (mem.updated_at || new Date()).toISOString(),
      }));

      // Filter out deleted memories before caching
      const filteredResults = this.filterDeletedMemories(mappedResults, userId);

      const searchResult = {
        results: filteredResults,
        total: filteredResults.length,
      };

      // Cache the filtered results
      CacheService.setAllMemories(userId, searchResult);

      return searchResult;
    } catch (error) {
      return { results: [], total: 0 };
    }
  }

  static async updateMemory(
    memoryId: string,
    text: string,
    userId?: string
  ): Promise<boolean> {
    const mem0Client = await getClient();
    if (!mem0Client) {
      return false;
    }

    try {
      await mem0Client.update(memoryId, text, {
        user_id: userId,
      });

      // Invalidate cache for this specific memory
      CacheService.invalidateMemory(memoryId);

      return true;
    } catch (error) {
      return false;
    }
  }

  static async deleteMemory(
    memoryId: string,
    userId?: string
  ): Promise<boolean> {
    const mem0Client = await getClient();
    if (!mem0Client) {
      return false;
    }

    try {
      await mem0Client.delete(memoryId, {
        user_id: userId,
      });

      // Invalidate ALL cache for this user since we need to remove the deleted memory from all cached results
      if (userId) {
        CacheService.invalidateUserMemories(userId);
      } else {
        CacheService.invalidateMemory(memoryId);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Filter out memories that have been deleted locally
   * This prevents deleted memories from being cited in responses
   */
  static filterDeletedMemories(memories: Memory[], userId: string): Memory[] {
    if (memories.length === 0) return memories;

    try {
      // Get all deleted memory IDs for this user
      // We look for delete operations in memory_links and check if they're from user's conversations
      const deletedMemoryIds = db
        .prepare(
          `
        SELECT DISTINCT ml.mem0_id
        FROM memory_links ml
        JOIN messages m ON ml.message_id = m.id
        JOIN conversations c ON m.conversation_id = c.id
        WHERE ml.operation = 'delete' AND c.user_id = ?
      `
        )
        .all(userId)
        .map((row: any) => row.mem0_id);

      if (deletedMemoryIds.length === 0) {
        return memories;
      }

      // Filter out deleted memories
      const filteredMemories = memories.filter(
        (memory) => !deletedMemoryIds.includes(memory.id)
      );

      if (filteredMemories.length < memories.length) {
        const removedIds = memories
          .filter((m) => !filteredMemories.includes(m))
          .map((m) => m.id);
      }

      return filteredMemories;
    } catch (error) {
      // Return original memories if filtering fails
      return memories;
    }
  }
}

export default Mem0Service;
