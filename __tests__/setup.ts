import '@testing-library/jest-dom';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock environment variables
process.env.MEM0_API_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-key';
process.env.NEXTAUTH_SECRET = 'test-secret';