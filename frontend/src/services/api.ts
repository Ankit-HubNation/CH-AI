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

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google AI',
    description: 'Complex reasoning with 2M token context window',
    tag: 'Recommended',
    supportsRAG: true
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google AI',
    description: 'Fast, lightweight model optimized for high-speed response',
    tag: 'Ultra Fast',
    supportsRAG: true
  },
  {
    id: 'ch-ai-intelligence',
    name: 'CH-AI Intelligence v2',
    provider: 'CH Neural Engine',
    description: 'Specialized Apple Intelligence-style multimodal assistant',
    tag: 'Local Hybrid',
    supportsRAG: true
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Superior coding capability and natural tone',
    tag: 'Coding Lead',
    supportsRAG: false
  }
];

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

// Simulated AI responses tailored to query keywords
export const simulateAiStreamResponse = (
  userQuery: string,
  modelId: string,
  ragEnabled: boolean,
  onChunk: (chunk: string, fullText: string) => void,
  onComplete: (finalMessage: Message) => void
) => {
  const isCodeQuery = userQuery.toLowerCase().includes('code') || userQuery.toLowerCase().includes('react') || userQuery.toLowerCase().includes('function');
  const isRagQuery = ragEnabled || userQuery.toLowerCase().includes('document') || userQuery.toLowerCase().includes('rag');

  let fullResponse = '';
  
  if (isRagQuery) {
    fullResponse = `Based on your indexed documents (**Apple_Intelligence_Design_Guidelines.pdf** & **CH_AI_System_Architecture.docx**):\n\n` +
      `1. **Glassmorphic Panels**: Blur value should be set to \`backdrop-blur-md\` (16px to 20px) with border transparency at \`rgba(255, 255, 255, 0.08)\`.\n` +
      `2. **Soft Gradients**: Main accent uses Indigo (\`#6366f1\`) to Cyan (\`#06b6d4\`) with subtle pink highlights.\n` +
      `3. **RAG Vector Search**: Embeddings are retrieved using Cosine Similarity over top-k chunks.\n\n` +
      `Would you like me to elaborate on the vector embedding schema?`;
  } else if (isCodeQuery) {
    fullResponse = 'Here is a clean implementation of an Apple Intelligence glowing pill container in React:\n\n' +
      '```tsx\n' +
      'const GlowingPill = ({ children }: { children: React.ReactNode }) => {\n' +
      '  return (\n' +
      '    <div className="relative p-[1px] rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 via-cyan-400 to-pink-500 animate-apple-glow">\n' +
      '      <div className="bg-slate-950/90 backdrop-blur-xl rounded-full px-6 py-3">\n' +
      '        {children}\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  );\n' +
      '};\n' +
      '```\n\n' +
      'This applies a rotating multi-color glow border combined with deep frosted glass backdrop blur.';
  } else {
    fullResponse = `I am CH-AI, running on **${AVAILABLE_MODELS.find(m => m.id === modelId)?.name || 'Gemini 1.5 Pro'}**. ` +
      `I'm styled after Apple Intelligence aesthetics with subtle glassmorphism, soft indigo-cyan gradients, and ultra-fluid animations.\n\n` +
      `How can I assist you with your project today? You can open the right Document panel to upload PDFs and query your personal knowledge base.`;
  }

  const words = fullResponse.split(' ');
  let currentIdx = 0;

  const interval = setInterval(() => {
    if (currentIdx < words.length) {
      const nextChunk = words[currentIdx] + (currentIdx === words.length - 1 ? '' : ' ');
      fullResponse = words.slice(0, currentIdx + 1).join(' ');
      onChunk(nextChunk, fullResponse);
      currentIdx++;
    } else {
      clearInterval(interval);
      onComplete({
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        content: fullResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoningTime: 0.8,
        citations: isRagQuery ? ['Apple_Intelligence_Design_Guidelines.pdf (p. 14)', 'CH_AI_System_Architecture.docx (p. 3)'] : undefined
      });
    }
  }, 40);
};
