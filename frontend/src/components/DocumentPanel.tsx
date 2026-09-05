import React, { useState } from 'react';
import { X, UploadCloud, FileText, Trash2, CheckCircle2, Sliders, Database, Sparkles, AlertCircle } from 'lucide-react';
import { type DocumentFile } from '../services/api';

interface DocumentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentFile[];
  onUploadDocument: (file: File) => void;
  onDeleteDocument: (id: string) => void;
  ragEnabled: boolean;
  setRagEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  selectedDocumentId: string | null;
  onSelectDocument: (id: string) => void;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  isOpen,
  onClose,
  documents,
  onUploadDocument,
  onDeleteDocument,
  ragEnabled,
  setRagEnabled,
  selectedDocumentId,
  onSelectDocument,
}) => {
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.75);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadDocument(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadDocument(e.target.files[0]);
    }
  };

  return (
    <aside className="w-80 h-full glass-panel border-l border-white/10 flex flex-col justify-between z-30 transition-all duration-300 relative shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-sm text-slate-100">Knowledge Base (RAG)</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* RAG Master Switch */}
        <div className="p-3.5 rounded-2xl glass-card border border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Vector Retrieval</p>
              <p className="text-[10px] text-slate-400">Inject doc context into AI query</p>
            </div>
          </div>
          <button
            onClick={() => setRagEnabled(prev => !prev)}
            className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ${
              ragEnabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
              ragEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* File Upload Dropzone */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2 block">
            Upload Documents
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              id="rag-file-upload"
            />
            <label htmlFor="rag-file-upload" className="cursor-pointer">
              <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-medium text-slate-200">Drop PDF, DOCX, or TXT here</p>
              <p className="text-[10px] text-slate-400 mt-1">Files automatically chunked & vectorized</p>
            </label>
          </div>
        </div>

        {/* Uploaded Document List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Indexed Documents ({documents.length})
            </span>
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-center text-xs text-slate-500">
                No documents uploaded yet.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={`p-3 rounded-2xl glass-card border transition-all duration-200 flex items-start justify-between cursor-pointer ${
                    selectedDocumentId === doc.id
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-apple-glow text-white'
                      : 'border-white/10 hover:border-white/20 text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <div className={`flex items-center gap-2 mt-1 text-[10px] ${selectedDocumentId === doc.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span className="text-indigo-300">{doc.chunks} chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vector Search Settings */}
        <div className="pt-2 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>RAG Retrieval Parameters</span>
          </div>

          {/* Top-K Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Top-K Context Chunks</span>
              <span className="text-cyan-300 font-mono font-semibold">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-white/10 rounded-lg h-1.5 cursor-pointer"
            />
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Cosine Threshold</span>
              <span className="text-indigo-300 font-mono font-semibold">{similarityThreshold}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
              className="w-full accent-indigo-400 bg-white/10 rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 bg-slate-950/40 text-[11px] text-slate-400 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>Vector embeddings generated locally using CH-AI Embedding v2.</span>
      </div>
    </aside>
  );
};
