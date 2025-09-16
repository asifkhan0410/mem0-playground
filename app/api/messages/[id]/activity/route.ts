import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import db from '@/lib/database';
import { MemoryLink } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get memory links for this message
    const memoryLinks = db.prepare(`
      SELECT ml.*, m.conversation_id
      FROM memory_links ml
      JOIN messages m ON ml.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      WHERE ml.message_id = ? AND c.user_id = ?
      ORDER BY ml.created_at ASC
    `).all(params.id, session.user.id) as MemoryLink[];

    const activity = {
      added: memoryLinks.filter(link => link.operation === 'add').length,
      updated: memoryLinks.filter(link => link.operation === 'update').length,
      deleted: memoryLinks.filter(link => link.operation === 'delete').length,
      details: memoryLinks,
    };

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error fetching message activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}