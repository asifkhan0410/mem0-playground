export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface MemoryLink {
  id: string;
  message_id: string;
  mem0_id: string;
  operation: 'add' | 'update' | 'delete';
  created_at: string;
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

export interface MemoryActivity {
  added: number;
  updated: number;
  deleted: number;
  details: MemoryLink[];
}

export interface ChatResponse {
  content: string;
  citedMemories: string[];
}