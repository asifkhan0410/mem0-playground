import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import db from '@/lib/database';
import { MemoryLink } from '@/types';

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

    // Get memory links for this message
    const memoryLinks = db.prepare(`
      SELECT ml.id, ml.message_id, ml.mem0_id, ml.operation, ml.old_content, ml.new_content, ml.created_at, m.conversation_id
      FROM memory_links ml
      JOIN messages m ON ml.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      WHERE ml.message_id = ? AND c.user_id = ?
      ORDER BY ml.created_at ASC
    `).all(params.id, user.id) as MemoryLink[];

    const activity = {
      added: memoryLinks.filter(link => link.operation === 'add').length,
      updated: memoryLinks.filter(link => link.operation === 'update').length,
      deleted: memoryLinks.filter(link => link.operation === 'delete').length,
      details: memoryLinks,
    };

    const response = NextResponse.json({ activity });
    
    // Add cache headers - cache for 30 seconds if there's activity, no cache if empty
    if (activity.added > 0 || activity.updated > 0 || activity.deleted > 0) {
      response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    } else {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    return response;
  } catch (error) {
    // console.error('Error fetching message activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}