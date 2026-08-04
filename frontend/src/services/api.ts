export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  reasoningTime?: number;
  citations?: string[];
  attachedFiles?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastMessage: string;
  model: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: string;
  status: 'processing' | 'indexed';
  chunks: number;
  uploadTime: string;
  type: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  tag: string;
  supportsRAG: boolean;
}

export let AVAILABLE_MODELS: ModelOption[] = [];

export const fetchModels = async (): Promise<ModelOption[]> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/models');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    AVAILABLE_MODELS = data.map((m: any) => {
      if (typeof m === 'string') {
        return {
          id: m,
          name: m,
          provider: 'Local',
          description: '',
          tag: 'Local',
          supportsRAG: true
        };
      }
      return {
        id: m.id || m.model || m.name || 'unknown',
        name: m.name || m.model || m.id || 'Unknown',
        provider: m.provider || 'Local',
        description: m.description || '',
        tag: m.tag || 'Local',
        supportsRAG: m.supportsRAG ?? true
      };
    });
    return AVAILABLE_MODELS;
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Apple Intelligence Glassmorphism UI',
    createdAt: 'Today 12:45 PM',
    lastMessage: 'Here is the sleek design layout using Tailwind...',
    model: 'gemini-1.5-pro'
  },
  {
    id: 'conv-2',
    title: 'Vector RAG Document Processing',
    createdAt: 'Yesterday',
    lastMessage: 'Indexed 45 pages of PDF context into memory.',
    model: 'ch-ai-intelligence'
  },
  {
    id: 'conv-3',
    title: 'React 19 & Vite Performance Optimization',
    createdAt: 'Aug 2, 2026',
    lastMessage: 'Lazy loading chunk strategy configured.',
    model: 'gemini-1.5-flash'
  }
];

export const INITIAL_DOCUMENTS: DocumentFile[] = [
  {
    id: 'doc-1',
    name: 'Apple_Intelligence_Design_Guidelines.pdf',
    size: '2.4 MB',
    status: 'indexed',
    chunks: 24,
    uploadTime: '10 mins ago',
    type: 'pdf'
  },
  {
    id: 'doc-2',
    name: 'CH_AI_System_Architecture.docx',
    size: '1.1 MB',
    status: 'indexed',
    chunks: 12,
    uploadTime: '1 hour ago',
    type: 'docx'
  }
];

export const sendChatMessage = async (
  userQuery: string,
  modelId: string,
  ragEnabled: boolean
): Promise<Message> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userQuery,
        model: modelId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const textContent = data.response || data.reply || data.message || data.content || typeof data === 'string' ? data : JSON.stringify(data);
    
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: textContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reasoningTime: data.reasoningTime || 0.5,
      citations: data.citations
    };
  } catch (error) {
    console.error('Failed to send message:', error);
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: 'Error communicating with backend. Please try again later.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/conversations');
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return await response.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/messages/${conversationId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return await response.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const deleteConversationApi = async (conversationId: string): Promise<void> => {
  try {
    await fetch(`http://127.0.0.1:8000/conversation/${conversationId}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error(e);
  }
};

export const renameConversationApi = async (conversationId: string, title: string): Promise<void> => {
  try {
    await fetch(`http://127.0.0.1:8000/conversation/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
  } catch (e) {
    console.error(e);
  }
};

export const uploadDocumentApi = async (file: File): Promise<DocumentFile> => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch('http://127.0.0.1:8000/upload', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload document');
    return await response.json();
  } catch (e) {
    console.error(e);
    return {
      id: 'doc-' + Date.now(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: 'indexed',
      chunks: Math.floor(Math.random() * 15) + 5,
      uploadTime: 'Just now',
      type: file.name.split('.').pop() || 'file',
    };
  }
};

export const chatWithDocumentApi = async (
  userQuery: string,
  modelId: string,
  documentId: string
): Promise<Message> => {
  try {
    const response = await fetch('http://127.0.0.1:8000/chat-with-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userQuery,
        model: modelId,
        document_id: documentId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const textContent = data.response || data.reply || data.message || data.content || typeof data === 'string' ? data : JSON.stringify(data);
    
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: textContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reasoningTime: data.reasoningTime || 0.5,
      citations: data.citations
    };
  } catch (error) {
    console.error('Failed to chat with document:', error);
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: 'Error communicating with document backend. Please try again later.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
};
