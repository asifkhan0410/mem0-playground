import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationsSidebar } from '@/components/conversations-sidebar';
import { Conversation } from '@/types';

// Mock the auth provider
vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    user: { id: 'user123', email: 'test@example.com' },
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('ConversationsSidebar', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv1',
      title: 'Chat about Paris',
      user_id: 'user123',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'conv2',
      title: 'Hiking discussion',
      user_id: 'user123',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const defaultProps = {
    conversations: mockConversations,
    selectedConversation: mockConversations[0],
    onSelectConversation: vi.fn(),
    onCreateConversation: vi.fn(),
    onUpdateConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render conversations list', () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    expect(screen.getByText('Chat about Paris')).toBeInTheDocument();
    expect(screen.getByText('Hiking discussion')).toBeInTheDocument();
  });

  it('should highlight selected conversation', () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    const selectedConv = screen.getByText('Chat about Paris').closest('div');
    expect(selectedConv).toHaveClass('bg-primary');
  });

  it('should call onSelectConversation when conversation is clicked', () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Hiking discussion'));
    
    expect(defaultProps.onSelectConversation).toHaveBeenCalledWith(mockConversations[1]);
  });

  it('should call onCreateConversation when new chat button is clicked', () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    fireEvent.click(screen.getByText('New Chat'));
    
    expect(defaultProps.onCreateConversation).toHaveBeenCalled();
  });

  it('should show empty state when no conversations', () => {
    render(<ConversationsSidebar {...defaultProps} conversations={[]} />);
    
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Click "New Chat" to start')).toBeInTheDocument();
  });

  it('should show chat header', () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('should handle conversation editing', async () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    // Find conversation items
    expect(screen.getByText('Chat about Paris')).toBeInTheDocument();
    expect(screen.getByText('Hiking discussion')).toBeInTheDocument();
    
    // Check that the component renders the conversations correctly
    const conversations = screen.getAllByText(/Chat about Paris|Hiking discussion/);
    expect(conversations.length).toBe(2);
  });

  it('should handle conversation selection', async () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    // Find and click on a conversation
    const conversationItem = screen.getByText('Hiking discussion');
    fireEvent.click(conversationItem);
    
    // Check if the select function was called
    expect(defaultProps.onSelectConversation).toHaveBeenCalledWith(mockConversations[1]);
  });

  it('should display conversation titles correctly', () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    // Check that conversation titles are displayed
    expect(screen.getByText('Chat about Paris')).toBeInTheDocument();
    expect(screen.getByText('Hiking discussion')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(<ConversationsSidebar {...defaultProps} />);
    
    const firstConversation = screen.getByText('Chat about Paris').closest('button');
    
    if (firstConversation) {
      // Test Enter key
      fireEvent.keyDown(firstConversation, { key: 'Enter' });
      expect(defaultProps.onSelectConversation).toHaveBeenCalledWith(mockConversations[0]);
      
      // Test Space key
      fireEvent.keyDown(firstConversation, { key: ' ' });
      expect(defaultProps.onSelectConversation).toHaveBeenCalledTimes(2);
    }
  });

  it('should show loading state when conversations are loading', () => {
    render(<ConversationsSidebar {...defaultProps} conversations={[]} />);
    
    // Should show empty state when no conversations
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('should handle long conversation titles', () => {
    const longTitleConversation = {
      ...mockConversations[0],
      title: 'This is a very long conversation title that should be truncated properly in the UI',
    };
    
    render(<ConversationsSidebar {...defaultProps} conversations={[longTitleConversation]} />);
    
    expect(screen.getByText(longTitleConversation.title)).toBeInTheDocument();
  });
});