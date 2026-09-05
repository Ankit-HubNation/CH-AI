import React, { useState } from 'react';
import { Sparkles, Copy, Check, User, Clock, FileText, ExternalLink } from 'lucide-react';
import { type Message } from '../services/api';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isUser = message.sender === 'user';

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Basic code block parser for markdown standard formatting ```lang code ```
  const renderFormattedContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Push text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'code',
        language: match[1] || 'typescript',
        value: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex),
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/90 shadow-2xl">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-cyan-400 uppercase tracking-wider font-semibold">
                {part.language}
              </span>
              <button
                onClick={() => handleCopyCode(part.value)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all duration-150"
              >
                {copiedCode === part.value ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed">
              <code>{part.value}</code>
            </pre>
          </div>
        );
      }

      // Inline text formatting (bolding, inline code)
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-sm">
          {part.value.split('\n').map((line, lIdx) => {
            // Replace **text** with bold
            const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Replace `code` with inline code chip
            const withCode = formattedLine.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 font-mono text-xs border border-white/10">$1</code>');

            return (
              <span 
                key={lIdx} 
                dangerouslySetInnerHTML={{ __html: withCode }} 
                className="block mb-1.5 last:mb-0"
              />
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-cyan-500 to-pink-500 p-[1.5px] shadow-apple-glow shrink-0 mt-0.5">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </div>
        </div>
      )}

      <div className={`max-w-2xl group ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Header timestamp & status */}
        <div className={`flex items-center gap-2 mb-1.5 px-1 text-[11px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-semibold text-slate-300">{isUser ? 'You' : 'CH-AI'}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
          {message.reasoningTime && (
            <span className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Clock className="w-3 h-3" />
              <span>{message.reasoningTime}s thought</span>
            </span>
          )}
        </div>

        {/* Message Content Container */}
        <div
          className={`p-4 rounded-3xl backdrop-blur-xl shadow-glass transition-all duration-200 border ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600/30 to-indigo-900/30 border-indigo-500/30 text-white rounded-tr-sm'
              : 'glass-panel border-white/10 text-slate-100 rounded-tl-sm'
          }`}
        >
          {renderFormattedContent(message.content)}

          {/* Attached Files Tag */}
          {message.attachedFiles && message.attachedFiles.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
              {message.attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate max-w-[150px]">{file}</span>
                </div>
              ))}
            </div>
          )}

          {/* Citations section if present */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-[11px] font-semibold text-indigo-300 mb-1.5 flex items-center gap-1">
                <ExternalLink className="w-3 h-3 text-indigo-400" />
                <span>Retrieved Context Sources:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((cite, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-[11px] text-indigo-200">
                    {cite}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
