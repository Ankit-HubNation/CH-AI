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
  sendChatMessage,
  fetchConversations,
  fetchMessages,
  deleteConversationApi,
  renameConversationApi,
  uploadDocumentApi,
  chatWithDocumentApi
} from '../services/api';

export const Home: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documentPanelOpen, setDocumentPanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
  const [ragEnabled, setRagEnabled] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Store messages per conversation
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});

  React.useEffect(() => {
    fetchConversations().then(async data => {
      setConversations(data);
      if (data.length > 0) {
        setActiveConversationId(data[0].id);
        const msgs = await fetchMessages(data[0].id);
        setMessagesMap(prev => ({ ...prev, [data[0].id]: msgs }));
      }
    });
  }, []);

  const [documents, setDocuments] = useState<DocumentFile[]>(INITIAL_DOCUMENTS);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active messages list
  const activeMessages = activeConversationId ? (messagesMap[activeConversationId] || []) : [];

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    if (!messagesMap[id]) {
      const msgs = await fetchMessages(id);
      setMessagesMap(prev => ({ ...prev, [id]: msgs }));
    }
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

  const handleDeleteConversation = async (id: string) => {
    await deleteConversationApi(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    setMessagesMap(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
        if (!messagesMap[remaining[0].id]) {
          const msgs = await fetchMessages(remaining[0].id);
          setMessagesMap(prev => ({ ...prev, [remaining[0].id]: msgs }));
        }
      } else {
        setActiveConversationId(null);
      }
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    await renameConversationApi(id, title);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  const handleSendMessage = async (text: string, attachedFiles?: string[]) => {
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

    const finalMessage = ragEnabled && selectedDocumentId
      ? await chatWithDocumentApi(text, selectedModel, selectedDocumentId)
      : await sendChatMessage(text, selectedModel, ragEnabled);

    setMessagesMap(prev => {
      const currentMsgs = prev[currentConvId!] || [];
      return {
        ...prev,
        [currentConvId!]: [...currentMsgs, finalMessage],
      };
    });
    setIsLoading(false);
  };

  const handleUploadDocument = async (file: File) => {
    const newDoc = await uploadDocumentApi(file);
    setDocuments(prev => [newDoc, ...prev]);
    setRagEnabled(true);
    setSelectedDocumentId(newDoc.id);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedDocumentId === id) {
      setSelectedDocumentId(null);
    }
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
          onRenameConversation={handleRenameConversation}
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
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={setSelectedDocumentId}
        />
      </div>
    </div>
  );
};
