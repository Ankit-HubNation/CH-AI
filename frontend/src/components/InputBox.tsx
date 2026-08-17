import React, { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Paperclip, Mic, Sparkles, X, FileCheck } from 'lucide-react';

interface InputBoxProps {
  onSendMessage: (text: string, attachedFiles?: string[]) => void;
  isLoading: boolean;
  ragEnabled: boolean;
  setRagEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
}

export const InputBox: React.FC<InputBoxProps> = ({
  onSendMessage,
  isLoading,
  ragEnabled,
  setRagEnabled,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!inputText.trim() && attachedFiles.length === 0) || isLoading) return;
    onSendMessage(inputText.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
    setInputText('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map(f => f.name);
      setAttachedFiles(prev => [...prev, ...names]);
    }
  };

  const removeAttachedFile = (name: string) => {
    setAttachedFiles(prev => prev.filter(f => f !== name));
  };

  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setInputText('Draft a Document Intelligence glassmorphism interface specification.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2 sticky bottom-0 z-20">
      {/* Attached file chips preview */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-2xl glass-panel w-fit animate-in fade-in slide-in-from-bottom-1">
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-xs text-cyan-300 font-medium">
              <FileCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">{file}</span>
              <button
                onClick={() => removeAttachedFile(file)}
                className="hover:text-rose-400 p-0.5 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Floating Knowledge Layer Input Box */}
      <div className={`relative rounded-3xl p-[1.5px] transition-all duration-300 ${
        isLoading || inputText.trim().length > 0
          ? 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-pink-500 shadow-apple-glow-lg'
          : 'bg-white/15 hover:bg-white/25 shadow-glass'
      }`}>
        <div className="bg-slate-950/90 backdrop-blur-2xl rounded-[23px] px-4 py-3 flex items-end gap-3">
          {/* File Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150 mb-0.5"
            title="Attach Document or Image"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* RAG Context Quick Badge */}
          <button
            onClick={() => setRagEnabled(prev => !prev)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 mb-0.5 ${
              ragEnabled
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
            title="Toggle RAG Document Context"
          >
            <Sparkles className={`w-4 h-4 ${ragEnabled ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">RAG</span>
          </button>

          {/* Main Textarea */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Listening...' : 'Ask CH-AI anything or upload documents...'}
            rows={1}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none max-h-32 min-h-[24px] py-1 leading-relaxed font-sans"
          />

          {/* Voice Input Trigger */}
          <button
            onClick={toggleVoiceRecording}
            className={`p-2 rounded-xl transition-all duration-150 mb-0.5 ${
              isRecording
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Voice Input Simulation"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && attachedFiles.length === 0) || isLoading}
            className={`p-2.5 rounded-2xl flex items-center justify-center transition-all duration-200 mb-0.5 ${
              inputText.trim() || attachedFiles.length > 0
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 hover:scale-105 shadow-apple-glow font-bold'
                : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
