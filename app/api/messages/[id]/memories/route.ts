import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { Mem0Service } from '@/lib/mem0';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;

    // Extract memory IDs from the message content
    const messageResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/messages/${params.id}`);
    if (!messageResponse.ok) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    const messageData = await messageResponse.json();
    const message = messageData.message;
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Extract memory IDs from the content
    const memoryMatches = message.content.match(/\[memory:([^\]]+)\]/g);
    if (!memoryMatches || memoryMatches.length === 0) {
      return NextResponse.json({ memories: [] });
    }

    const memoryIds = memoryMatches.map(match => {
      const idMatch = match.match(/\[memory:([^\]]+)\]/);
      return idMatch ? idMatch[1] : null;
    }).filter(Boolean);

    // Fetch memory details from Mem0
    const memories = await Promise.all(
      memoryIds.map(async (memoryId, index) => {
        try {
          const memory = await Mem0Service.getMemoryById(user.id, memoryId);
          return {
            id: memoryId,
            text: memory?.text || 'Memory not found',
            score: memory?.score || 0,
            index: index + 1,
            metadata: memory?.metadata || {}
          };
        } catch (error) {
          console.error(`Error fetching memory ${memoryId}:`, error);
          return {
            id: memoryId,
            text: 'Memory not found',
            score: 0,
            index: index + 1,
            metadata: {}
          };
        }
      })
    );

    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error fetching referenced memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
