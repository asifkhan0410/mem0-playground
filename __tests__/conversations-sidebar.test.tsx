import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConversationsSidebar } from '@/components/conversations-sidebar';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
  }),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockConversations = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Test Conversation 1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'Test Conversation 2',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

describe('ConversationsSidebar', () => {
  const mockProps = {
    conversations: mockConversations,
    selectedConversation: mockConversations[0],
    onSelectConversation: vi.fn(),
    onCreateConversation: vi.fn(),
    onUpdateConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
  };

  it('renders conversations list', () => {
    render(<ConversationsSidebar {...mockProps} />);
    
    expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    expect(screen.getByText('Test Conversation 2')).toBeInTheDocument();
  });

  it('calls onCreateConversation when new chat button is clicked', () => {
    render(<ConversationsSidebar {...mockProps} />);
    
    const newChatButton = screen.getByText('New Chat');
    fireEvent.click(newChatButton);
    
    expect(mockProps.onCreateConversation).toHaveBeenCalled();
  });

  it('highlights selected conversation', () => {
    render(<ConversationsSidebar {...mockProps} />);
    
    const selectedConversation = screen.getByText('Test Conversation 1').closest('div');
    expect(selectedConversation).toHaveClass('bg-primary');
  });

  it('shows empty state when no conversations', () => {
    render(
      <ConversationsSidebar 
        {...mockProps} 
        conversations={[]} 
        selectedConversation={null}
      />
    );
    
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });
});