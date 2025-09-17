import { vi, expect } from 'vitest';
import { Memory, Conversation, Message } from '@/types';

// Mock data factories
export const createMockMemory = (overrides: Partial<Memory> = {}): Memory => ({
  id: 'mem-123',
  text: 'I live in Paris and love hiking',
  hash: 'hash-123',
  metadata: { source: 'chat' },
  score: 0.9,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-123',
  title: 'Test Conversation',
  user_id: 'user-123',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-123',
  conversation_id: 'conv-123',
  role: 'user',
  content: 'Hello, world!',
  created_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

// Mock fetch responses
export const createMockFetchResponse = (data: any, ok: boolean = true) => ({
  ok,
  json: async () => data,
  status: ok ? 200 : 400,
  statusText: ok ? 'OK' : 'Bad Request',
});

// Mock API responses
export const mockMemorySearchResponse = (memories: Memory[]) => ({
  memories,
});

export const mockMemoryActivityResponse = (activity: {
  added: number;
  updated: number;
  deleted: number;
  details?: any[];
}) => ({
  activity,
});

export const mockConversationsResponse = (conversations: Conversation[]) => ({
  conversations,
});

export const mockMessagesResponse = (messages: Message[]) => ({
  messages,
});

// Mock Supabase auth
export const mockSupabaseAuth = () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
  };

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
  };

  return {
    user: mockUser,
    session: mockSession,
    signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockImplementation((callback) => {
      // Simulate signed in state
      callback('SIGNED_IN', mockSession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
  };
};

// Mock Mem0 client
export const mockMem0Client = () => ({
  add: vi.fn().mockResolvedValue([{ id: 'new-memory-123' }]),
  search: vi.fn().mockResolvedValue([
    {
      id: 'mem1',
      memory: 'I live in Paris',
      hash: 'hash1',
      metadata: {},
      score: 0.9,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }
  ]),
  getAll: vi.fn().mockResolvedValue([]),
  get: vi.fn().mockResolvedValue(null),
  update: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue({}),
});

// Mock OpenAI response
export const mockOpenAIResponse = (content: string, citedMemories: string[] = []) => ({
  choices: [{
    message: {
      content,
      role: 'assistant',
    },
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
  citedMemories,
});

// Test assertions helpers
export const expectMemoryToBeDisplayed = (screen: any, memory: Memory) => {
  expect(screen.getByText(memory.text)).toBeInTheDocument();
};

export const expectMemoryActivityChip = (screen: any, added: number, updated: number = 0, deleted: number = 0) => {
  if (added > 0) expect(screen.getByText(`+${added}`)).toBeInTheDocument();
  if (updated > 0) expect(screen.getByText(`~${updated}`)).toBeInTheDocument();
  if (deleted > 0) expect(screen.getByText(`−${deleted}`)).toBeInTheDocument();
};

export const expectMemoryCitations = (screen: any, count: number) => {
  const citations = screen.getAllByTitle(/Referenced Memory/);
  expect(citations).toHaveLength(count);
};

// Mock environment variables
export const setupTestEnv = () => {
  process.env.MEM0_API_KEY = 'test-mem0-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
};

// Clean up mocks
export const cleanupMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
};

// Wait for async operations
export const waitForAsync = (ms: number = 100) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock fetch with specific responses
export const mockFetch = (responses: Array<{ url: string | RegExp; response: any }>) => {
  const fetchMock = vi.fn();
  
  responses.forEach(({ url, response }) => {
    fetchMock.mockImplementation((requestUrl: string) => {
      const matches = typeof url === 'string' 
        ? requestUrl.includes(url)
        : url.test(requestUrl);
        
      if (matches) {
        return Promise.resolve(createMockFetchResponse(response));
      }
      return Promise.resolve(createMockFetchResponse({}, false));
    });
  });
  
  global.fetch = fetchMock;
  return fetchMock;
};

// Memory score color helpers
export const getScoreColorClass = (score: number) => {
  if (score >= 0.7) return 'bg-green-50 text-green-700';
  if (score >= 0.4) return 'bg-blue-50 text-blue-700';
  if (score >= 0.2) return 'bg-yellow-50 text-yellow-700';
  return 'bg-orange-50 text-orange-700';
};

// Test data generators
export const generateMockMemories = (count: number): Memory[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockMemory({
      id: `mem-${i + 1}`,
      text: `Memory ${i + 1}: I love ${['hiking', 'photography', 'cooking', 'reading'][i % 4]}`,
      score: 0.9 - (i * 0.1),
    })
  );
};

export const generateMockConversations = (count: number): Conversation[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockConversation({
      id: `conv-${i + 1}`,
      title: `Conversation ${i + 1}`,
    })
  );
};
