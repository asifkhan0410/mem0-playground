import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Mem0Service from '@/lib/mem0';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query) {
      const memories = await Mem0Service.searchMemories(session.user.id, query, limit);
      return NextResponse.json({ memories, total: memories.length });
    } else {
      const result = await Mem0Service.getAllMemories(session.user.id, limit, offset);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}