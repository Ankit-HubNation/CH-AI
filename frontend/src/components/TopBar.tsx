import React, { useState, useEffect } from 'react';
import { PanelLeft, FileText, ChevronDown, Sparkles, Sliders, ShieldCheck, Zap } from 'lucide-react';
import { fetchModels, type ModelOption } from '../services/api';

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  documentPanelOpen: boolean;
  setDocumentPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  ragEnabled: boolean;
  setRagEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  documentCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  documentPanelOpen,
  setDocumentPanelOpen,
  selectedModel,
  setSelectedModel,
  ragEnabled,
  setRagEnabled,
  documentCount,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);

  useEffect(() => {
    fetchModels().then(data => {
      if (data.length > 0) {
        setModels(data);
        if (data.some(m => m.id === 'qwen3:8b')) {
          setSelectedModel('qwen3:8b');
        } else {
          setSelectedModel(data[0].id);
        }
      }
    });
  }, [setSelectedModel]);

  const activeModelObj = models.find(m => m.id === selectedModel) || models[0] || {
    id: 'loading',
    name: 'Loading...',
    provider: '',
    description: '',
    tag: 'Wait',
    supportsRAG: false
  };

  return (
    <header className="h-16 px-4 border-b border-white/10 flex items-center justify-between glass-panel z-20 sticky top-0 backdrop-blur-xl">
      {/* Left controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* Model Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-200 text-sm font-medium"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-200 font-semibold">{activeModelObj.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeModelObj.tag}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Model Dropdown Menu */}
          {modelDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setModelDropdownOpen(false)} 
              />
              <div className="absolute top-12 left-0 w-80 rounded-2xl glass-panel border border-white/15 p-2 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 tracking-wider uppercase border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>Select Intelligence Model</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  {models.map((model: ModelOption) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start justify-between ${
                        selectedModel === model.id
                          ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-600/20 border border-indigo-500/40 text-white'
                          : 'hover:bg-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{model.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-slate-300">
                            {model.provider}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center Status / Intelligence Badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-pink-500/10 border border-white/10">
        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-xs font-medium bg-gradient-to-r from-indigo-300 via-cyan-200 to-pink-300 bg-clip-text text-transparent">
          Apple Intelligence Engine Active
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* RAG Quick Toggle */}
        <button
          onClick={() => setRagEnabled(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            ragEnabled
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-apple-glow'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:text-slate-200'
          }`}
          title="Toggle Retrieval Augmented Generation"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${ragEnabled ? 'text-indigo-400' : 'text-slate-400'}`} />
          <span>RAG Context</span>
          <div className={`w-1.5 h-1.5 rounded-full ${ragEnabled ? 'bg-indigo-400' : 'bg-slate-600'}`} />
        </button>

        {/* Document Panel Toggle */}
        <button
          onClick={() => setDocumentPanelOpen(prev => !prev)}
          className={`relative p-2.5 rounded-xl transition-all duration-200 ${
            documentPanelOpen
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'hover:bg-white/10 text-slate-400 hover:text-white border border-transparent'
          }`}
          title="Open Document & RAG Knowledge Base"
        >
          <FileText className="w-5 h-5" />
          {documentCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center shadow-lg">
              {documentCount}
            </span>
          )}
        </button>

        <button className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200">
          <Sliders className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
