import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Sparkles, UserCheck, Search, ChevronRight, Edit2 } from 'lucide-react';
import { type Conversation } from '../services/api';

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleEditClick = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <aside className="w-72 h-full glass-panel border-r border-white/10 flex flex-col justify-between z-30 transition-all duration-300 relative shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 space-y-4">
        {/* Brand logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-pink-500 p-[1.5px] shadow-apple-glow">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight gradient-text-apple">CH-AI</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Apple Intelligence UI</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full relative group overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-pink-500 shadow-apple-glow hover:shadow-apple-glow-lg transition-all duration-300"
        >
          <div className="w-full h-full bg-slate-950/80 group-hover:bg-slate-950/60 backdrop-blur-md rounded-[15px] px-4 py-3 flex items-center justify-center gap-2.5 transition-all duration-200">
            <Plus className="w-4 h-4 text-cyan-300 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold text-sm text-slate-100 group-hover:text-white">New Chat</span>
          </div>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-200"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 py-1">
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
          Recent History
        </div>

        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-lg'
                    : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <div className="truncate flex-1">
                    {editingId === conv.id ? (
                      <form onSubmit={(e) => handleRenameSubmit(e, conv.id)}>
                        <input
                          autoFocus
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={(e) => handleRenameSubmit(e, conv.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-slate-900/50 border border-indigo-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                        />
                      </form>
                    ) : (
                      <>
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{conv.createdAt}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={(e) => handleEditClick(e, conv.id, conv.title)}
                    className="p-1 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors"
                    title="Rename Conversation"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer / User Profile */}
      <div className="p-3 border-t border-white/10 bg-slate-950/40">
        <div className="flex items-center justify-between p-2.5 rounded-xl glass-card hover:bg-white/10 transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Pro Account</p>
              <p className="text-[10px] text-cyan-400">CH-AI Neural Core v2.4</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
};
