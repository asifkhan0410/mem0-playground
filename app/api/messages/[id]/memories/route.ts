import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { Mem0Service } from '@/lib/mem0';
import db from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;

    // Get the message directly from the database
    const message = db.prepare(`
      SELECT m.*, c.user_id
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = ? AND c.user_id = ?
    `).get(params.id, user.id);
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get referenced memories from the database (instant access - no API calls needed!)
    const memoryReferences = db.prepare(`
      SELECT 
        memory_id, 
        memory_text, 
        relevance_score, 
        reference_order, 
        memory_metadata, 
        memory_created_at, 
        memory_updated_at
      FROM message_memory_references
      WHERE message_id = ?
      ORDER BY reference_order ASC
    `).all(params.id);

    if (!memoryReferences || memoryReferences.length === 0) {
      return NextResponse.json({ memories: [] });
    }

    // Return memories directly from database (instant!)
    const memories = memoryReferences.map((ref: any) => {
      let metadata = {};
      try {
        metadata = JSON.parse(ref.memory_metadata || '{}');
      } catch (error) {
        console.error('Error parsing memory metadata:', error);
      }

      return {
        id: ref.memory_id,
        text: ref.memory_text || 'Memory not found',
        score: ref.relevance_score || 0,
        index: ref.reference_order,
        metadata: metadata
      };
    });
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error fetching referenced memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
