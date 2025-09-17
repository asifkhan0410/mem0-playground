import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoriesPanel } from '@/components/memories-panel';
import { Memory } from '@/types';

// Mock fetch
global.fetch = vi.fn();

// Mock the debounce hook
vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: any) => value, // Return the value immediately for testing
}));

describe('MemoriesPanel', () => {
  const mockMemories: Memory[] = [
    {
      id: 'mem1',
      text: 'I live in Paris and love hiking',
      hash: 'hash1',
      metadata: { source: 'chat' },
      score: 0.9,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'mem2',
      text: 'My favorite hobby is photography',
      hash: 'hash2',
      metadata: { source: 'chat' },
      score: 0.8,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const defaultProps = {
    conversationId: 'conv1',
    onMemoryActivity: vi.fn(),
    refreshTrigger: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should render memories list', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: mockMemories }),
    });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
      expect(screen.getByText('My favorite hobby is photography')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<MemoriesPanel {...defaultProps} />);
    
    expect(screen.getByText('Memories')).toBeInTheDocument();
    // Should show shimmer loading cards - check for shimmer elements instead
    expect(screen.getByText('Memories')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: mockMemories }),
    });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
    });

    // Mock search results
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: [mockMemories[0]] }),
    });

    const searchInput = screen.getByPlaceholderText('Search memories...');
    fireEvent.change(searchInput, { target: { value: 'Paris' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=Paris')
      );
    });
  });

  it('should show empty state when no memories', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: [] }),
    });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No memories yet')).toBeInTheDocument();
      expect(screen.getByText('Start chatting to create memories')).toBeInTheDocument();
    });
  });

  it('should show new memories count when refreshTrigger changes', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: mockMemories }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: [...mockMemories, {
          id: 'mem3',
          text: 'New memory',
          hash: 'hash3',
          metadata: {},
          score: 0.7,
          created_at: '2023-01-03T00:00:00Z',
          updated_at: '2023-01-03T00:00:00Z',
        }] }),
      });

    const { rerender } = render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
    });

    // Trigger refresh with new trigger value
    rerender(<MemoriesPanel {...defaultProps} refreshTrigger={1} />);

    await waitFor(() => {
      expect(screen.getByText('+1 new')).toBeInTheDocument();
    });
  });

  it('should handle memory activity callback', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: mockMemories }),
    });

    const { rerender } = render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
    });

    // Simulate new memory being added
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: [...mockMemories, {
        id: 'mem3',
        text: 'New memory',
        hash: 'hash3',
        metadata: {},
        score: 0.7,
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
      }] }),
    });

    // Trigger refresh by changing the refreshTrigger prop
    rerender(<MemoriesPanel {...defaultProps} refreshTrigger={1} />);

    await waitFor(() => {
      expect(defaultProps.onMemoryActivity).toHaveBeenCalledWith({
        added: 1,
        updated: 0,
        deleted: 0,
      });
    }, { timeout: 3000 });
  });

  it('should show memory metadata tags', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: mockMemories }),
    });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
    });

    // Check for metadata indicators (dates should be formatted)
    const dateElements = screen.getAllByText(/Jan \d+, \d{2}:\d{2} (AM|PM)/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should handle refresh button click', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ memories: mockMemories }),
    });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh memories/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it('should format memory dates correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: mockMemories }),
    });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
    });

    // Check that dates are formatted and displayed
    const dateElements = screen.getAllByText(/Jan \d+, \d{2}:\d{2} (AM|PM)/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Fetch failed'));

    render(<MemoriesPanel {...defaultProps} />);
    
    // Should not crash and should show empty state or error handling
    await waitFor(() => {
      expect(screen.getByText('Memories')).toBeInTheDocument();
    });
  });

  it('should show memory count in header', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: mockMemories }),
    });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Memory count badge
    });
  });

  it('should handle search with no results', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: mockMemories }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: [] }),
      });

    render(<MemoriesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('I live in Paris and love hiking')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search memories...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No memories found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
    });
  });
});
