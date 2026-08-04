import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { DocumentPanel } from '../components/DocumentPanel';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_DOCUMENTS,
  type Conversation,
  type Message,
  type DocumentFile,
  simulateAiStreamResponse,
} from '../services/api';

export const Home: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documentPanelOpen, setDocumentPanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
  const [ragEnabled, setRagEnabled] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv-1');
  
  // Store messages per conversation
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({
    'conv-1': [
      {
        id: 'm1',
        sender: 'user',
        content: 'Design an Apple Intelligence inspired UI for CH-AI assistant.',
        timestamp: '12:44 PM',
      },
      {
        id: 'm2',
        sender: 'assistant',
        content: 'Here is the sleek design layout using Tailwind CSS, glassmorphism, and indigo-cyan glows.\n\n' +
          '```tsx\n' +
          'export const AppleGlowCard = () => (\n' +
          '  <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-apple-glow">\n' +
          '    <h3 className="gradient-text-apple font-bold">CH-AI Intelligence</h3>\n' +
          '  </div>\n' +
          ');\n' +
          '```\n\n' +
          'You can upload documents in the right panel to activate real-time vector RAG context.',
        timestamp: '12:45 PM',
        reasoningTime: 0.6,
      },
    ],
  });

  const [documents, setDocuments] = useState<DocumentFile[]>(INITIAL_DOCUMENTS);
  const [isLoading, setIsLoading] = useState(false);

  // Active messages list
  const activeMessages = activeConversationId ? (messagesMap[activeConversationId] || []) : [];

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleNewChat = () => {
    const newId = 'conv-' + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      createdAt: 'Just now',
      lastMessage: '',
      model: selectedModel,
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
    setMessagesMap(prev => ({ ...prev, [newId]: [] }));
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setMessagesMap(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSendMessage = (text: string, attachedFiles?: string[]) => {
    let currentConvId = activeConversationId;

    // If no active conversation exists, create a new one
    if (!currentConvId) {
      currentConvId = 'conv-' + Date.now();
      const newConv: Conversation = {
        id: currentConvId,
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        createdAt: 'Just now',
        lastMessage: text,
        model: selectedModel,
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(currentConvId);
    } else {
      // Update existing conversation title if it was "New Conversation"
      setConversations(prev =>
        prev.map(c => {
          if (c.id === currentConvId) {
            return {
              ...c,
              title: c.title === 'New Conversation' ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : c.title,
              lastMessage: text,
            };
          }
          return c;
        })
      );
    }

    const userMessage: Message = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFiles,
    };

    // Add user message
    setMessagesMap(prev => ({
      ...prev,
      [currentConvId!]: [...(prev[currentConvId!] || []), userMessage],
    }));

    setIsLoading(true);

    // Create placeholder streaming assistant message
    const streamMsgId = 'ast-' + Date.now();
    const streamingAssistantMsg: Message = {
      id: streamMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessagesMap(prev => ({
      ...prev,
      [currentConvId!]: [...(prev[currentConvId!] || []), streamingAssistantMsg],
    }));

    // Trigger simulated AI stream response
    simulateAiStreamResponse(
      text,
      selectedModel,
      ragEnabled,
      (_chunk, fullText) => {
        setMessagesMap(prev => {
          const currentMsgs = prev[currentConvId!] || [];
          return {
            ...prev,
            [currentConvId!]: currentMsgs.map(m =>
              m.id === streamMsgId ? { ...m, content: fullText } : m
            ),
          };
        });
      },
      (finalMessage) => {
        setMessagesMap(prev => {
          const currentMsgs = prev[currentConvId!] || [];
          return {
            ...prev,
            [currentConvId!]: currentMsgs.map(m =>
              m.id === streamMsgId ? { ...finalMessage, id: streamMsgId } : m
            ),
          };
        });
        setIsLoading(false);
      }
    );
  };

  const handleUploadDocument = (file: File) => {
    const newDoc: DocumentFile = {
      id: 'doc-' + Date.now(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: 'indexed',
      chunks: Math.floor(Math.random() * 15) + 5,
      uploadTime: 'Just now',
      type: file.name.split('.').pop() || 'file',
    };
    setDocuments(prev => [newDoc, ...prev]);
    setRagEnabled(true);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-apple-dark text-slate-100 overflow-hidden select-none">
      {/* Top Header Navigation */}
      <TopBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        documentPanelOpen={documentPanelOpen}
        setDocumentPanelOpen={setDocumentPanelOpen}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        ragEnabled={ragEnabled}
        setRagEnabled={setRagEnabled}
        documentCount={documents.length}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
        />

        {/* Central Chat Interface */}
        <ChatWindow
          messages={activeMessages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          ragEnabled={ragEnabled}
          setRagEnabled={setRagEnabled}
        />

        {/* Hidden Right Document & RAG Panel */}
        <DocumentPanel
          isOpen={documentPanelOpen}
          onClose={() => setDocumentPanelOpen(false)}
          documents={documents}
          onUploadDocument={handleUploadDocument}
          onDeleteDocument={handleDeleteDocument}
          ragEnabled={ragEnabled}
          setRagEnabled={setRagEnabled}
        />
      </div>
    </div>
  );
};
