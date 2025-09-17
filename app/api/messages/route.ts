import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import db from '@/lib/database';
import Mem0Service from '@/lib/mem0';
import OpenAIService from '@/lib/openai';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;

    const { conversationId, content } = await request.json();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations 
      WHERE id = ? AND user_id = ?
    `).get(conversationId, user.id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Save user message
    const userMessageId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'user', ?)
    `).run(userMessageId, conversationId, content);

    // Get conversation history for context
    const messageHistory = db.prepare(`
      SELECT role, content FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `).all(conversationId) as Pick<Message, 'role' | 'content'>[];

    // Search relevant memories
    const relevantMemories = await Mem0Service.searchMemories(user.id, content, 5);

    // Generate assistant response
    const llmResponse = await OpenAIService.generateResponse(
      messageHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      relevantMemories
    );

    // Save assistant message
    const assistantMessageId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, ?, ?)
    `).run(assistantMessageId, conversationId, 'assistant', llmResponse.content);

    // Store referenced memories for instant access with full details
    if (llmResponse.citedMemories && llmResponse.citedMemories.length > 0) {
      // Find the corresponding memory details from the search results
      const referencedMemories = relevantMemories.filter(memory => 
        llmResponse.citedMemories.includes(memory.id)
      );

      referencedMemories.forEach((memory, index) => {
        const referenceId = uuidv4();
        db.prepare(`
          INSERT INTO message_memory_references (
            id, message_id, memory_id, memory_text, relevance_score, 
            reference_order, memory_metadata, memory_created_at, memory_updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          referenceId, 
          assistantMessageId, 
          memory.id, 
          memory.text,
          memory.score || 0,
          index + 1,
          JSON.stringify(memory.metadata || {}),
          memory.created_at,
          memory.updated_at
        );
      });
    }

    // Add memory asynchronously (don't wait for completion)
    Mem0Service.addMemory(user.id, content, { conversationId, messageId: userMessageId })
      .then(memoryIds => {
        // Save memory links
        memoryIds.forEach(memoryId => {
          const linkId = uuidv4();
          db.prepare(`
            INSERT INTO memory_links (id, message_id, mem0_id, operation)
            VALUES (?, ?, ?, 'add')
          `).run(linkId, userMessageId, memoryId);
        });
      })
      .catch(error => {
        console.error('Error adding memory:', error);
      });

    // Update conversation timestamp
    db.prepare(`
      UPDATE conversations 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(conversationId);

    const userMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(userMessageId);
    const assistantMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(assistantMessageId);

    return NextResponse.json({ 
      userMessage, 
      assistantMessage,
      citedMemories: llmResponse.citedMemories 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}