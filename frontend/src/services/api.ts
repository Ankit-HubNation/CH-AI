export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  reasoningTime?: number;
  citations?: string[];
  attachedFiles?: string[];
  autoSwitchedToCpu?: boolean;
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

const API_BASE_URL = "http://127.0.0.1:8000";
console.log("API base URL:", API_BASE_URL);

export let AVAILABLE_MODELS: ModelOption[] = [];

const formatTimestamp = (value?: string): string => {
  if (!value) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeConversation = (item: any): Conversation => ({
  id: String(item.id),
  title: item.title || 'New Chat',
  createdAt: formatTimestamp(item.created_at || item.createdAt),
  lastMessage: item.last_message || item.lastMessage || '',
  model: item.model || 'qwen2.5:3b',
});

const normalizeMessage = (item: any): Message => ({
  id: String(item.id ?? `msg-${Date.now()}`),
  sender: item.sender || item.role || 'assistant',
  content: item.content || item.response || item.answer || item.message || '',
  timestamp: formatTimestamp(item.created_at || item.timestamp),
  reasoningTime: item.reasoningTime,
  citations: item.citations,
  attachedFiles: item.attachedFiles,
  autoSwitchedToCpu: item.auto_switched_to_cpu || item.autoSwitchedToCpu,
});

const getResponseText = (data: any): string => {
  if (typeof data === 'string') {
    return data;
  }

  return data.response || data.answer || data.reply || data.message || data.content || JSON.stringify(data);
};

export const fetchModels = async (): Promise<ModelOption[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Models response:", data); // Temporary debug
    
    const modelsList = Array.isArray(data) ? data : (data.models || data.data || []);
    
    AVAILABLE_MODELS = modelsList.map((m: any) => {
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
    throw error;
  }
};

export const fetchHardware = async (): Promise<{ vram_mb: number; cpu_mode: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hardware`);
    if (response.ok) {
      const data = await response.json();
      return {
        vram_mb: data.vram_mb,
        cpu_mode: data.vram_mb < 6000
      };
    }
  } catch (e) {
    console.error("Failed to fetch hardware stats:", e);
  }
  return { vram_mb: 8192, cpu_mode: false };
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Multi-Model Workspace Glassmorphism UI',
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
    name: 'CH-AI_Design_Guidelines.pdf',
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
  conversationId: string | number,
  message: string,
  model: string,
  _ragEnabled: boolean,
  files: File[] = []
): Promise<Message> => {
  try {
    const conversation_id = Number(conversationId);
    const attachments = await Promise.all(files.map(file => new Promise<{ name: string; data_url: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data_url: String(reader.result) });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    console.log("Sending payload:", {
      conversation_id,
      message,
      model
    });

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id,
        message,
        model,
        attachments
      })
    });
    
    if (!response.ok) {
      let errorData = `HTTP error! status: ${response.status}`;
      try {
        const errJson = await response.json();
        errorData = JSON.stringify(errJson);
      } catch (e) {}
      throw new Error(errorData);
    }
    
    const data = await response.json();
    const textContent = getResponseText(data);
    
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: textContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reasoningTime: data.reasoningTime || 0.5,
      citations: data.citations,
      autoSwitchedToCpu: data.auto_switched_to_cpu
    };
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: error.message || 'Error communicating with backend. Please try again later.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation`);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    const data = await response.json();
    console.log("Conversations response:", data);
    return (Array.isArray(data) ? data : []).map(normalizeConversation);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const createConversationApi = async (): Promise<Conversation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return normalizeConversation(await response.json());
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const url = `${API_BASE_URL}/conversation/${chatId}/message`;
    console.log("Chat ID:", chatId);
    console.log(
      "Loading messages from:",
      `${API_BASE_URL}/conversation/${chatId}/message`
    );
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch messages');
    const data = await response.json();
    return (Array.isArray(data) ? data : []).map(normalizeMessage);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const deleteConversationApi = async (conversationId: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error(e);
  }
};

export const renameConversationApi = async (conversationId: string, title: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
      method: 'PATCH',
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
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload document');
    const data = await response.json();
    return {
      id: data.filename || file.name,
      name: data.filename || file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: 'indexed',
      chunks: data.content ? Math.max(1, Math.ceil(data.content.length / 500)) : 1,
      uploadTime: 'Just now',
      type: file.name.split('.').pop() || 'file',
    };
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
    const response = await fetch(`${API_BASE_URL}/chat-with-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: userQuery,
        model: modelId,
        filename: documentId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const textContent = getResponseText(data);
    
    return {
      id: 'msg-' + Date.now(),
      sender: 'assistant',
      content: textContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reasoningTime: data.reasoningTime || 0.5,
      citations: data.citations,
      autoSwitchedToCpu: data.auto_switched_to_cpu
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
