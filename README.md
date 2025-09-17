# Chat with Living Memory

A sophisticated chat application built with Next.js that integrates with Mem0 for persistent AI memory management. Users can have conversations with an AI that remembers context across sessions and provides cited responses based on stored memories.

## ✨ Features

### Core Functionality
- **Multi-conversation chat interface** - Create, rename, and delete conversation threads
- **Living Memory Integration** - Real-time memory creation, updates, and deletion using Mem0
- **Memory Citations** - AI responses include clickable citations linking to specific memories
- **Per-message Memory Activity** - Visual indicators showing memory changes (+2 ~1 −0)
- **Async Memory Processing** - Non-blocking memory extraction with progress indicators
- **Memories Library** - Browse, search, edit, and manage all stored memories

### Technical Features
- **Next.js 13 with App Router** - Modern React framework with TypeScript
- **Real-time Memory Sync** - Automatic memory updates during conversations
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark/Light Theme** - System-aware theme switching
- **Authentication** - Email magic links with Supabase
- **Database** - SQLite with better-sqlite3 for local development
- **Testing Suite** - Unit tests (Vitest), component tests (RTL), E2E tests (Playwright)

## 🏗️ Architecture

### Data Flow
1. **User sends message** → Saved to local database
2. **Memory extraction** → Async call to Mem0 API to create memories
3. **Memory search** → Retrieve relevant memories for context
4. **LLM response** → Generate response using memories as context with citations
5. **Memory activity tracking** → Link memory operations to specific messages

### Database Schema
```sql
users (id, email, name, image, created_at)
conversations (id, user_id, title, created_at, updated_at)
messages (id, conversation_id, role, content, created_at)
memory_links (id, message_id, mem0_id, operation, created_at)
```

### API Integration
- **Mem0 Service** - Memory creation, search, update, delete operations
- **OpenAI Service** - LLM responses with memory context and citation extraction
- **Authentication** - Supabase Auth Email providers

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Mem0 API account
- OpenAI API account

### Installation
```bash
# Clone repository
git clone <repository-url>
cd chat-with-living-memory

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
```

### Environment Variables
```bash
# Required
MEM0_API_KEY=your_mem0_api_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
MEM0_ORG_ID=your_mem0_org_id
MEM0_PROJECT_ID=your_mem0_project_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Database Setup
```bash
# Initialize database
npm run db:migrate

# Optional: Seed with sample data
npm run db:seed
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Generate test coverage
npm run test:coverage
```

## 🧪 Testing

### Test Coverage
- **Unit Tests** - Mem0 API wrapper, utility functions
- **Component Tests** - React components with RTL
- **Integration Tests** - API routes and database operations
- **E2E Tests** - Complete user flows with Playwright

### Running Tests
```bash
# Unit and component tests
npm test

# E2E tests (requires dev server running)
npm run test:e2e

# Coverage report
npm run test:coverage
```

### E2E Test Scenarios
1. **Memory Creation Flow** - Send message → memory extraction → activity indicator
2. **Memory Citation Flow** - Ask question → AI uses memories → citations appear
3. **Memory Management** - Edit/delete memories → verify changes persist
4. **Multi-conversation** - Create/switch conversations → isolated memory contexts

## 🔧 Error Handling

### Client-Side
- Loading states for async operations
- Error boundaries for React components
- Optimistic updates with rollback
- Network error recovery

### Server-Side
- API error responses with proper status codes
- Database transaction rollbacks
- External API failure handling
- Rate limiting protection

## 🎯 What's Implemented vs Skipped

### ✅ Implemented
- Complete chat interface with memory integration
- Real-time memory activity tracking
- Memory citations in AI responses
- Comprehensive memories library
- Authentication system
- Responsive design with dark mode
- Testing suite with E2E scenarios
- Database schema and API routes

### ⏭️ Future Enhancements
- Memory categories and tags
- Export/import memory data
- Advanced memory search filters
- Memory analytics dashboard
- Collaborative conversations
- Voice message support

## 📊 Performance Considerations

- **Async Memory Processing** - Doesn't block chat flow
- **Optimistic UI Updates** - Immediate feedback with rollback
- **Memory Pagination** - Efficient loading of large memory sets
- **Database Indexing** - Fast queries on conversation/memory lookups
- **API Caching** - Reduced external API calls where possible

## 🔐 Security

- **Server-side API Keys** - Never exposed to client
- **User Isolation** - Memories scoped to authenticated users
- **SQL Injection Prevention** - Parameterized queries
- **CSRF Protection** - NextAuth.js security features
- **Input Validation** - Zod schemas for API validation

## 📈 Time Spent

- **Project Setup & Architecture** - 2 hours
- **Database Design & API Routes** - 3 hours  
- **Mem0 Integration** - 2 hours
- **Chat Interface Development** - 4 hours
- **Memory Management Features** - 3 hours
- **Authentication & Security** - 2 hours
- **Testing Implementation** - 2 hours
- **UI/UX Polish & Accessibility** - 2 hours

**Total Development Time: ~15 hours**

## 🚦 Memory Change Detection

The application uses a polling-based approach to detect and display per-message memory changes:

1. **Memory Links Table** - Tracks all memory operations (add/update/delete) linked to specific messages
2. **Async Processing** - Memory extraction happens in background after message is sent
3. **Activity Indicators** - UI shows "+2 ~1 −0" badges based on memory_links records
4. **Real-time Updates** - Periodic polling updates activity indicators as memories are processed

## 📖 Citation System

Memory citations work by:
1. **Search Phase** - Retrieve top-k relevant memories before LLM call
2. **Context Injection** - Include memory text with IDs in LLM prompt
3. **Citation Extraction** - Parse LLM response for `[memory:id]` patterns
4. **UI Rendering** - Replace citations with interactive badges linking to memories

This ensures AI responses are grounded in stored memories with transparent attribution.