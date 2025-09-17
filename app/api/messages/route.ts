import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import db from '@/lib/database';
import Mem0Service from '@/lib/mem0';
import OpenAIService from '@/lib/openai';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/types';

/**
 * Links recent memory operations (updates/deletes) to the current message if they're relevant
 * This helps show users what memory changes affected their current query
 */
async function linkRecentMemoryOperations(userId: string, messageId: string, content: string) {
  try {
    // Find recent memory operations (last 24 hours) that don't have a real message context
    // (i.e., they're linked to system messages in the deletion tracking conversation)
    const recentOperations = db.prepare(`
      SELECT DISTINCT ml.id as link_id, ml.mem0_id, ml.operation, ml.created_at, m.role, m.content as system_message_content
      FROM memory_links ml
      JOIN messages m ON ml.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ? 
        AND ml.operation IN ('update', 'delete')
        AND m.role = 'system'
        AND ml.created_at > datetime('now', '-24 hours')
        AND ml.mem0_id NOT IN (
          -- Exclude operations already linked to non-system messages for this specific operation
          SELECT DISTINCT ml2.mem0_id 
          FROM memory_links ml2 
          JOIN messages m2 ON ml2.message_id = m2.id
          WHERE ml2.operation = ml.operation 
            AND ml2.mem0_id = ml.mem0_id 
            AND m2.role != 'system'
            AND ml2.created_at > ml.created_at
        )
      ORDER BY ml.created_at DESC
    `).all(userId);

    if (recentOperations.length === 0) {
      return;
    }

    // For each recent operation, check if it would have been relevant to the current query
    for (const operation of recentOperations as any[]) {
      try {
        // For deleted memories, we can't search them anymore, so we'll use a heuristic:
        // If this is a delete operation, assume it might be relevant and link it
        // For update operations, we could potentially search for the memory and check relevance
        
        let shouldLink = false;
        
        if (operation.operation === 'delete') {
          // For deletions, check if the deleted memory content is relevant to the current query
          try {
            const systemMessage = JSON.parse(operation.system_message_content);
            if (systemMessage.memoryContent) {
              // Use a simple text similarity check - you could enhance this with more sophisticated matching
              const queryLower = content.toLowerCase();
              const memoryLower = systemMessage.memoryContent.toLowerCase();
              
              // Check for keyword overlap or semantic similarity
              const queryWords = queryLower.split(/\s+/).filter((word: string) => word.length > 3);
              const memoryWords = memoryLower.split(/\s+/).filter((word: string) => word.length > 3);
              
              const commonWords = queryWords.filter((word: string) => memoryWords.includes(word));
              const relevanceScore = commonWords.length / Math.max(queryWords.length, 1);
              
              // Link if there's some relevance (threshold: 20% word overlap)
              shouldLink = relevanceScore > 0.2;
              
            } else {
              // Fallback: link all deletions if we can't parse the content
              shouldLink = true;
            }
          } catch (error) {
            // Fallback: link all deletions if we can't parse the content
            shouldLink = true;
          }
        } else if (operation.operation === 'update') {
          // For updates, check if the updated memory content is relevant to the current query
          try {
            const systemMessage = JSON.parse(operation.system_message_content);
            if (systemMessage.newContent || systemMessage.oldContent) {
              // Check relevance against both old and new content
              const queryLower = content.toLowerCase();
              const newContentLower = (systemMessage.newContent || '').toLowerCase();
              const oldContentLower = (systemMessage.oldContent || '').toLowerCase();
              
              const queryWords = queryLower.split(/\s+/).filter((word: string) => word.length > 3);
              
              // Check relevance for new content
              const newWords = newContentLower.split(/\s+/).filter((word: string) => word.length > 3);
              const newCommonWords = queryWords.filter((word: string) => newWords.includes(word));
              const newRelevanceScore = newCommonWords.length / Math.max(queryWords.length, 1);
              
              // Check relevance for old content
              const oldWords = oldContentLower.split(/\s+/).filter((word: string) => word.length > 3);
              const oldCommonWords = queryWords.filter((word: string) => oldWords.includes(word));
              const oldRelevanceScore = oldCommonWords.length / Math.max(queryWords.length, 1);
              
              // Link if either old or new content is relevant (threshold: 20% word overlap)
              shouldLink = newRelevanceScore > 0.2 || oldRelevanceScore > 0.2;
              
            } else {
              // Fallback: try to search for the memory directly
              const searchResults = await Mem0Service.searchMemories(userId, content, 10);
              shouldLink = searchResults.some(memory => memory.id === operation.mem0_id);
            }
          } catch (error) {
            // Fallback: try to search for the memory directly
            try {
              const searchResults = await Mem0Service.searchMemories(userId, content, 10);
              shouldLink = searchResults.some(memory => memory.id === operation.mem0_id);
            } catch (searchError) {
              // If all fails, err on the side of linking it
              shouldLink = true;
            }
          }
        }

        if (shouldLink) {
          // Create a new memory link connecting this operation to the current message
          const newLinkId = uuidv4();
          db.prepare(`
            INSERT INTO memory_links (id, message_id, mem0_id, operation)
            VALUES (?, ?, ?, ?)
          `).run(newLinkId, messageId, operation.mem0_id, operation.operation);
          
        }
      } catch (error) {
        // Error processing operation - continue with next
      }
    }
  } catch (error) {
    // Error linking recent memory operations - continue
  }
}

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

    // Link recent memory operations to this message if they're relevant
    linkRecentMemoryOperations(user.id, userMessageId, content);

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
        // Error adding memory - handled silently
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}