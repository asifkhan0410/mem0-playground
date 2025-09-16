# Supabase Migration Guide

This project has been migrated from NextAuth to Supabase Auth. Here's what you need to do to complete the setup:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from the project settings

## 2. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Mem0
MEM0_API_KEY=your-mem0-api-key
```

## 3. Database Setup

The local SQLite database has been updated to work with Supabase user IDs. The foreign key constraint between `conversations.user_id` and `users.id` has been removed since Supabase manages users externally.

### Current Local Database Schema

The local SQLite database now has these tables:

### Users Table (Optional - for local reference only)
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Conversations Table
```sql
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- References Supabase user ID
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Memory Links Table
```sql
CREATE TABLE memory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  memory_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Authentication Setup

In your Supabase project:

1. Go to Authentication > Settings
2. Enable email authentication
3. Configure your site URL (e.g., `http://localhost:3000` for development)
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## 5. GitHub OAuth (Optional)

If you want to keep GitHub authentication:

1. Go to Authentication > Providers
2. Enable GitHub provider
3. Add your GitHub OAuth app credentials

## 6. Row Level Security (RLS)

Enable RLS on your tables and create policies:

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for messages and memory_links
```

## 7. Migration Notes

- The authentication flow now uses Supabase's built-in email magic links
- GitHub OAuth is available through Supabase's OAuth providers
- User sessions are managed automatically by Supabase
- The middleware handles authentication redirects
- All API routes now use Supabase auth instead of NextAuth

## 8. Testing

1. Start your development server: `npm run dev`
2. Try signing in with email - you should receive a magic link
3. Test GitHub authentication if configured
4. Verify that protected routes redirect to sign-in when not authenticated

## Benefits of Supabase Auth

- **Simpler setup**: No need for custom email server configuration
- **Better developer experience**: Built-in magic links and OAuth
- **Real-time capabilities**: Supabase provides real-time subscriptions
- **Unified backend**: Database and auth in one service
- **Better security**: Built-in security features and RLS policies
