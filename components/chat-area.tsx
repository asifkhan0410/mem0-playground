'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Send, Brain, User, Bot, Plus, Minus, RotateCcw, RefreshCw } from 'lucide-react';
import { Conversation, Message, MemoryActivity } from '@/types';
import { MessageActivityDetails } from './message-activity-details';
import { RelevantMemories } from './relevant-memories';

interface ChatAreaProps {
  conversation: Conversation | null;
  onToggleMemories: () => void;
  showMemoriesPanel: boolean;
  onMemoryActivity?: (activity: { added: number; updated: number; deleted: number }) => void;
}

export function ChatArea({ conversation, onToggleMemories, showMemoriesPanel, onMemoryActivity }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageActivities, setMessageActivities] = useState<Record<string, MemoryActivity>>({});
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const [showRelevantMemories, setShowRelevantMemories] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchMessages = async () => {
    if (!conversation) return;
    
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`);
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Fetch memory activities for all user messages
      const userMessages = data.messages?.filter((msg: Message) => msg.role === 'user') || [];
      userMessages.forEach((msg: Message) => {
        fetchMessageActivity(msg.id);
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMessageActivity = async (messageId: string, retryCount = 0) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/activity`);
      const data = await response.json();
      
      const activity = data.activity;
      
      // If no activity yet and we haven't exceeded retry limit, try again
      if (!activity || (activity.added === 0 && activity.updated === 0 && activity.deleted === 0)) {
        if (retryCount < 10) { // Poll for up to 10 times (about 20 seconds)
          setTimeout(() => {
            fetchMessageActivity(messageId, retryCount + 1);
          }, 2000);
          return;
        }
      }

      // Update message activities
      setMessageActivities(prev => ({
        ...prev,
        [messageId]: activity,
      }));

      // Notify parent component about memory activity to trigger memories panel refresh
      if (onMemoryActivity && activity && (activity.added > 0 || activity.updated > 0 || activity.deleted > 0)) {
        onMemoryActivity({
          added: activity.added || 0,
          updated: activity.updated || 0,
          deleted: activity.deleted || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching message activity:', error);
      // Retry on error if we haven't exceeded limit
      if (retryCount < 5) {
        setTimeout(() => {
          fetchMessageActivity(messageId, retryCount + 1);
        }, 3000);
      }
    }
  };

  const retryMessage = async (messageId: string, content: string) => {
    if (!conversation || isLoading) return;

    setIsLoading(true);
    setFailedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: content,
        }),
      });

      const data = await response.json();
      
      if (data.userMessage && data.assistantMessage) {
        // Remove the failed message and add the new messages
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== messageId);
          return [...filtered, data.userMessage, data.assistantMessage];
        });
        
        // Start polling for memory activity immediately
        fetchMessageActivity(data.userMessage.id);
      } else {
        // Still failed
        setFailedMessages(prev => {
          const newSet = new Set(prev);
          newSet.add(messageId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error retrying message:', error);
      setFailedMessages(prev => {
        const newSet = new Set(prev);
        newSet.add(messageId);
        return newSet;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversation || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Create temporary user message to show immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: userMessage,
        }),
      });

      const data = await response.json();
      
      if (data.userMessage && data.assistantMessage) {
        // Replace temp user message with real one and add assistant response
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
          return [...filtered, data.userMessage, data.assistantMessage];
        });
        
        // Start polling for memory activity immediately
        fetchMessageActivity(data.userMessage.id);
      } else {
        // API response was successful but didn't return expected data
        setFailedMessages(prev => {
          const newSet = new Set(prev);
          newSet.add(tempUserMessage.id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark the message as failed instead of removing it
      setFailedMessages(prev => {
        const newSet = new Set(prev);
        newSet.add(tempUserMessage.id);
        return newSet;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageContent = (content: string) => {
    // Replace memory citations with highlighted text
    return content.replace(/\[memory:([^\]]+)\]/g, (match, memoryId) => {
      return `<span class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mx-0.5" title="Referenced Memory: ${memoryId}">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </span>`;
    });
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Welcome to Living Memory Chat</h3>
          <p className="text-sm">Select a conversation or create a new one to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex items-center justify-between bg-background/50 backdrop-blur">
        <div>
          <h2 className="font-semibold text-lg">{conversation.title}</h2>
          <p className="text-sm text-muted-foreground">
            AI with persistent memory
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMemories}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          {showMemoriesPanel ? 'Hide' : 'Show'} Memories
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`flex gap-3 max-w-3xl ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                </div>

                <div className={`flex-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border'
                  }`}>
                    {message.role === 'assistant' ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: formatMessageContent(message.content) 
                        }}
                      />
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex items-center justify-end gap-2 mt-2">
                      {failedMessages.has(message.id) ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="destructive" 
                            className="text-xs"
                          >
                            failed to send
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={() => retryMessage(message.id, message.content)}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            retry
                          </Button>
                        </div>
                      ) : messageActivities[message.id] ? (
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-6 px-2"
                            >
                              <span className="text-green-600 mr-1">
                                +{messageActivities[message.id].added}
                              </span>
                              <span className="text-yellow-600 mr-1">
                                ~{messageActivities[message.id].updated}
                              </span>
                              <span className="text-red-600">
                                −{messageActivities[message.id].deleted}
                              </span>
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right" className="w-[400px]">
                            <MessageActivityDetails
                              activity={messageActivities[message.id]}
                              messageContent={message.content}
                            />
                          </SheetContent>
                        </Sheet>
                      ) : message.id.startsWith('temp-') ? (
                        <Badge 
                          variant="secondary" 
                          className="text-xs animate-pulse"
                        >
                          processing...
                        </Badge>
                      ) : (
                        <Badge 
                          variant="secondary" 
                          className="text-xs animate-pulse"
                        >
                          updating memory...
                        </Badge>
                      )}
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <div className="mt-2">
                      {message.id.startsWith('temp-') ? (
                        <div className="flex items-center justify-start gap-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs animate-pulse"
                          >
                            extracting memory...
                          </Badge>
                        </div>
                      ) : (
                        (() => {
                          const memoryMatches = message.content.match(/\[memory:[^\]]+\]/g);
                          const memoryCount = memoryMatches?.length || 0;
                          
                          if (memoryCount > 0) {
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Brain className="h-3 w-3 mr-1" />
                                    Referenced {memoryCount} memories
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-6 px-2"
                                    onClick={() => {
                                      setShowRelevantMemories(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(message.id)) {
                                          newSet.delete(message.id);
                                        } else {
                                          newSet.add(message.id);
                                        }
                                        return newSet;
                                      });
                                    }}
                                  >
                                    {showRelevantMemories.has(message.id) ? 'Hide' : 'Show'} Details
                                  </Button>
                                </div>
                                
                                {showRelevantMemories.has(message.id) && (
                                  <RelevantMemories 
                                    messageId={message.id}
                                    onClose={() => {
                                      setShowRelevantMemories(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(message.id);
                                        return newSet;
                                      });
                                    }}
                                  />
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-3 max-w-3xl">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-block px-4 py-3 rounded-2xl bg-muted border">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-background/50 backdrop-blur">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}