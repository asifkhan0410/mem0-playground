import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { Mem0Service } from '@/lib/mem0';

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

    // Fetch memory details from Mem0
    const memory = await Mem0Service.getMemoryById(user.id, params.id);
    
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error fetching memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Memory text is required' }, { status: 400 });
    }

    // Update memory in Mem0
    const success = await Mem0Service.updateMemory(params.id, text.trim(), user.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Memory not found or could not be updated' }, { status: 404 });
    }

    // Fetch the updated memory to return
    const updatedMemory = await Mem0Service.getMemoryById(user.id, params.id);
    
    if (!updatedMemory) {
      return NextResponse.json({ error: 'Memory updated but could not be retrieved' }, { status: 500 });
    }

    return NextResponse.json({ memory: updatedMemory });
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;

    // Delete memory from Mem0
    const success = await Mem0Service.deleteMemory(params.id, user.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Memory not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}