import { describe, it, expect, vi } from 'vitest';
import { Mem0Service } from '@/lib/mem0';

// Mock the mem0ai module
vi.mock('mem0ai', () => ({
  MemoryClient: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ results: [{ id: 'test-memory-1' }] }),
    search: vi.fn().mockResolvedValue({ results: [] }),
    getAll: vi.fn().mockResolvedValue({ results: [], total: 0 }),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  })),
}));

describe('Mem0Service', () => {
  it('should add memory successfully', async () => {
    const memoryIds = await Mem0Service.addMemory('user123', 'I like hiking');
    expect(memoryIds).toEqual(['test-memory-1']);
  });

  it('should search memories', async () => {
    const memories = await Mem0Service.searchMemories('user123', 'hiking');
    expect(memories).toEqual([]);
  });

  it('should get all memories', async () => {
    const result = await Mem0Service.getAllMemories('user123');
    expect(result).toEqual({ results: [], total: 0 });
  });

  it('should update memory', async () => {
    const result = await Mem0Service.updateMemory('memory123', 'Updated text');
    expect(result).toBe(true);
  });

  it('should delete memory', async () => {
    const result = await Mem0Service.deleteMemory('memory123');
    expect(result).toBe(true);
  });
});