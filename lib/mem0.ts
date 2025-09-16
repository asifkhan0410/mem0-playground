import { MemoryClient, Memory as Mem0Memory } from 'mem0ai';

// Initialize client only if API key is available
const client = process.env.MEM0_API_KEY ? new MemoryClient({
  apiKey: process.env.MEM0_API_KEY,
  projectId: process.env.MEM0_PROJECT_ID,
}) : null;

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
    if (!client) {
      console.warn('MEM0 client not initialized - API key missing');
      return [];
    }
    
    try {
      const result = await client.add(text, {
        user_id: userId,
        metadata: metadata || {},
      });
      
      return result?.map((r: any) => r.id) || [];
    } catch (error) {
      console.error('Error adding memory:', error);
      throw new Error('Failed to add memory');
    }
  }

  static async searchMemories(userId: string, query: string, limit = 5): Promise<Memory[]> {
    if (!client) {
      console.warn('MEM0 client not initialized - API key missing');
      return [];
    }
    
    try {
      const result = await client.search(query, {
        user_id: userId,
        limit,
      });
      
      return (result || []).map((mem: Mem0Memory) => ({
        id: mem.id,
        text: mem.memory || '',
        hash: mem.hash || '',
        metadata: mem.metadata || {},
        score: mem.score,
        created_at: typeof mem.created_at === 'string' ? mem.created_at : (mem.created_at || new Date()).toISOString(),
        updated_at: typeof mem.updated_at === 'string' ? mem.updated_at : (mem.updated_at || new Date()).toISOString(),
      }));
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }

  static async getAllMemories(userId: string, limit = 50, offset = 0): Promise<MemorySearchResult> {
    if (!client) {
      console.warn('MEM0 client not initialized - API key missing');
      return { results: [], total: 0 };
    }
    
    try {
      const result = await client.getAll({
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
      
      return {
        results: mappedResults,
        total: mappedResults.length,
      };
    } catch (error) {
      console.error('Error getting all memories:', error);
      return { results: [], total: 0 };
    }
  }

  static async updateMemory(memoryId: string, text: string): Promise<boolean> {
    if (!client) {
      console.warn('MEM0 client not initialized - API key missing');
      return false;
    }
    
    try {
      await client.update(memoryId, text);
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      return false;
    }
  }

  static async deleteMemory(memoryId: string): Promise<boolean> {
    if (!client) {
      console.warn('MEM0 client not initialized - API key missing');
      return false;
    }
    
    try {
      await client.delete(memoryId);
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      return false;
    }
  }
}

export default Mem0Service;