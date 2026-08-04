import React, { useRef, useEffect } from 'react';
import { Sparkles, Code2, FileSearch, ArrowRight } from 'lucide-react';
import { type Message } from '../services/api';
import { MessageBubble } from './MessageBubble';
import { InputBox } from './InputBox';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, attachedFiles?: string[]) => void;
  ragEnabled: boolean;
  setRagEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onSendMessage,
  ragEnabled,
  setRagEnabled,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestionCards = [
    {
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      title: 'Apple Intelligence UI',
      prompt: 'Design a sleek dark-mode glassmorphic interface with soft cyan and indigo glowing borders.',
    },
    {
      icon: <FileSearch className="w-5 h-5 text-indigo-400" />,
      title: 'Vector RAG Retrieval',
      prompt: 'Search uploaded PDF specifications for design guidelines and Cosine similarity parameters.',
    },
    {
      icon: <Code2 className="w-5 h-5 text-pink-400" />,
      title: 'React & Vite Optimization',
      prompt: 'Write a TypeScript custom hook for simulated stream typing with real-time word rendering.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950/40">
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center my-auto py-12 px-4 animate-in fade-in duration-500">
            {/* Animated Logo Hero */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-cyan-400 to-pink-500 p-[2px] shadow-apple-glow-lg animate-float">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-cyan-300 animate-pulse" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight gradient-text-apple mb-3">
              How can CH-AI help you today?
            </h2>
            <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
              Powered by Apple Intelligence design aesthetics, RAG vector retrieval, and multi-model switching.
            </p>

            {/* Quick Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl w-full">
              {suggestionCards.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(card.prompt)}
                  className="p-4 rounded-2xl glass-card hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 text-left transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2 rounded-xl bg-white/5 w-fit mb-3 group-hover:scale-110 transition-transform">
                      {card.icon}
                    </div>
                    <h3 className="font-semibold text-xs text-slate-200 mb-1 group-hover:text-cyan-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                      {card.prompt}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Try Query</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* AI Reasoning / Streaming Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 my-4 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-cyan-500 to-pink-500 p-[1.5px] shadow-apple-glow shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
                  </div>
                </div>
                <div className="px-4 py-3 rounded-2xl glass-panel border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-200">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-medium">CH-AI Intelligence is processing query...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Floating Input Box */}
      <InputBox
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        ragEnabled={ragEnabled}
        setRagEnabled={setRagEnabled}
      />
    </div>
  );
};
