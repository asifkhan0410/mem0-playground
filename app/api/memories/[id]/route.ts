import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { Mem0Service } from '@/lib/mem0';
import db from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

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
    const { text, messageId } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Memory text is required' }, { status: 400 });
    }

    // Get the old memory content before updating for tracking changes
    let oldMemoryContent = '';
    try {
      const oldMemory = await Mem0Service.getMemoryById(user.id, params.id);
      if (oldMemory) {
        oldMemoryContent = oldMemory.text;
      }
    } catch (error) {
      // Error fetching old memory content - continue
    }

    // Update memory in Mem0
    const success = await Mem0Service.updateMemory(params.id, text.trim(), user.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Memory not found or could not be updated' }, { status: 404 });
    }

    // Always create a memory link for tracking updates
    let targetMessageId = messageId;
    
    if (!targetMessageId) {
      // If no message context, create a special system message for tracking
      let updateConversation = db.prepare(`
        SELECT id FROM conversations 
        WHERE user_id = ? AND title = '[System] Memory Updates'
      `).get(user.id) as { id: string } | undefined;
      
      let conversationId: string;
      if (!updateConversation) {
        conversationId = uuidv4();
        db.prepare(`
          INSERT INTO conversations (id, user_id, title)
          VALUES (?, ?, '[System] Memory Updates')
        `).run(conversationId, user.id);
      } else {
        conversationId = updateConversation.id;
      }
      
      // Create a system message to track this update
      targetMessageId = uuidv4();
      const systemMessageContent = JSON.stringify({
        action: 'memory_updated',
        memoryId: params.id,
        oldContent: oldMemoryContent,
        newContent: text.trim(),
        updatedAt: new Date().toISOString()
      });
      
      db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content)
        VALUES (?, ?, 'system', ?)
      `).run(targetMessageId, conversationId, systemMessageContent);
    } else {
      // Verify that the message belongs to the user
      const message = db.prepare(`
        SELECT m.id 
        FROM messages m 
        JOIN conversations c ON m.conversation_id = c.id 
        WHERE m.id = ? AND c.user_id = ?
      `).get(messageId, user.id);

      if (!message) {
        return NextResponse.json({ error: 'Invalid message context' }, { status: 400 });
      }
    }

    // Create memory link for tracking the update
    const linkId = uuidv4();
    db.prepare(`
      INSERT INTO memory_links (id, message_id, mem0_id, operation, old_content, new_content)
      VALUES (?, ?, ?, 'update', ?, ?)
    `).run(linkId, targetMessageId, params.id, oldMemoryContent, text.trim());
    
    // Fetch the updated memory to return
    const updatedMemory = await Mem0Service.getMemoryById(user.id, params.id);
    
    if (!updatedMemory) {
      return NextResponse.json({ error: 'Memory updated but could not be retrieved' }, { status: 500 });
    }

    return NextResponse.json({ memory: updatedMemory });
  } catch (error) {
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
    
    // Parse request body to get optional messageId
    let messageId = null;
    try {
      const body = await request.json();
      messageId = body.messageId;
    } catch (error) {
      // Body might be empty for DELETE requests, that's okay
    }

    // Get memory content before deletion for relevance checking
    let memoryContent = '';
    try {
      const memory = await Mem0Service.getMemoryById(user.id, params.id);
      if (memory) {
        memoryContent = memory.text;
      }
    } catch (error) {
      // Error fetching memory content before deletion - continue
    }

    // Delete memory from Mem0
    const success = await Mem0Service.deleteMemory(params.id, user.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Memory not found or could not be deleted' }, { status: 404 });
    }

    // Always create a memory link for tracking deletions
    let targetMessageId = messageId;
    
    if (!targetMessageId) {
      // If no message context, create a special "deletion tracking" message
      // First, find or create a special conversation for tracking deletions
      let deletionConversation = db.prepare(`
        SELECT id FROM conversations 
        WHERE user_id = ? AND title = '[System] Memory Deletions'
      `).get(user.id) as { id: string } | undefined;
      
      let conversationId: string;
      if (!deletionConversation) {
        conversationId = uuidv4();
        db.prepare(`
          INSERT INTO conversations (id, user_id, title)
          VALUES (?, ?, '[System] Memory Deletions')
        `).run(conversationId, user.id);
      } else {
        conversationId = deletionConversation.id;
      }
      
      // Create a system message to track this deletion
      targetMessageId = uuidv4();
      const systemMessageContent = JSON.stringify({
        action: 'memory_deleted',
        memoryId: params.id,
        memoryContent: memoryContent,
        deletedAt: new Date().toISOString()
      });
      
      db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content)
        VALUES (?, ?, 'system', ?)
      `).run(targetMessageId, conversationId, systemMessageContent);
    } else {
      // Verify that the message belongs to the user
      const message = db.prepare(`
        SELECT m.id 
        FROM messages m 
        JOIN conversations c ON m.conversation_id = c.id 
        WHERE m.id = ? AND c.user_id = ?
      `).get(messageId, user.id);

      if (!message) {
        return NextResponse.json({ error: 'Invalid message context' }, { status: 400 });
      }
    }

    // Create memory link for tracking the deletion
    const linkId = uuidv4();
    db.prepare(`
      INSERT INTO memory_links (id, message_id, mem0_id, operation, old_content)
      VALUES (?, ?, ?, 'delete', ?)
    `).run(linkId, targetMessageId, params.id, memoryContent);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { action, messageId } = await request.json();

    if (action === 'restore') {
      // Find the deletion record to get the original content
      const deletionLink = db.prepare(`
        SELECT ml.old_content, ml.message_id
        FROM memory_links ml
        JOIN messages m ON ml.message_id = m.id
        JOIN conversations c ON m.conversation_id = c.id
        WHERE ml.mem0_id = ? AND ml.operation = 'delete' AND c.user_id = ?
        ORDER BY ml.created_at DESC
        LIMIT 1
      `).get(params.id, user.id) as { old_content: string; message_id: string } | undefined;

      if (!deletionLink || !deletionLink.old_content) {
        return NextResponse.json({ error: 'No deletion record found or content unavailable' }, { status: 404 });
      }

      // Restore the memory in Mem0 with the original content
      const success = await Mem0Service.addMemory(user.id, deletionLink.old_content);
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to restore memory' }, { status: 500 });
      }

      // Create memory link for tracking the restoration
      let targetMessageId = messageId || deletionLink.message_id;
      
      const linkId = uuidv4();
      db.prepare(`
        INSERT INTO memory_links (id, message_id, mem0_id, operation, new_content)
        VALUES (?, ?, ?, 'add', ?)
      `).run(linkId, targetMessageId, params.id, deletionLink.old_content);
      
      // Fetch the restored memory to return
      const restoredMemory = await Mem0Service.getMemoryById(user.id, params.id);
      
      return NextResponse.json({ 
        success: true, 
        memory: restoredMemory,
        message: 'Memory restored successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}