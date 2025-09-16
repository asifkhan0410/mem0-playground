import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import Mem0Service from '@/lib/mem0';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query) {
      const memories = await Mem0Service.searchMemories(user.id, query, limit);
      return NextResponse.json({ memories, total: memories.length });
    } else {
      const result = await Mem0Service.getAllMemories(user.id, limit, offset);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}