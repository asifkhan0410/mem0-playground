'use client';

import { useState } from 'react';
import { ConversationsSidebar } from './conversations-sidebar';
import { ChatArea } from './chat-area';
import { MemoriesPanel } from './memories-panel';
import { Conversation } from '@/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface ChatLayoutProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation: (title?: string) => void;
  onUpdateConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatLayout({
  conversations,
  selectedConversation,
  onSelectConversation,
  onCreateConversation,
  onUpdateConversation,
  onDeleteConversation,
}: ChatLayoutProps) {
  const [showMemoriesPanel, setShowMemoriesPanel] = useState(true);
  const [memoriesRefreshTrigger, setMemoriesRefreshTrigger] = useState(0);

  const handleMemoryActivity = (activity: { added: number; updated: number; deleted: number }) => {
    // Trigger a refresh of the memories panel
    setMemoriesRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen flex">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <ConversationsSidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={onSelectConversation}
            onCreateConversation={onCreateConversation}
            onUpdateConversation={onUpdateConversation}
            onDeleteConversation={onDeleteConversation}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={showMemoriesPanel ? 55 : 80} minSize={40}>
          <ChatArea
            conversation={selectedConversation}
            onToggleMemories={() => setShowMemoriesPanel(!showMemoriesPanel)}
            showMemoriesPanel={showMemoriesPanel}
            onMemoryActivity={handleMemoryActivity}
          />
        </ResizablePanel>
        
        {showMemoriesPanel && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <MemoriesPanel 
                conversationId={selectedConversation?.id} 
                refreshTrigger={memoriesRefreshTrigger}
                onMemoryActivity={handleMemoryActivity}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}