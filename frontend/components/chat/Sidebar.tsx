'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Sparkles, Settings, LogOut, X } from 'lucide-react';
import clsx from 'clsx';
import type { ConversationSummary } from '@/lib/conversationApi';
import { groupConversationsByDate } from '@/lib/dateGroups';
import ConversationItem from './ConversationItem';

interface SidebarProps {
  conversations: ConversationSummary[];
  loadingConversations: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  userName?: string;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  conversations,
  loadingConversations,
  activeId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  userName,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const grouped = useMemo(() => groupConversationsByDate(filtered), [filtered]);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={clsx(
          'fixed md:static inset-y-0 left-0 z-40 w-72 shrink-0 flex flex-col bg-[#0e141b] border-r border-white/10 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Cortex
            </span>
          </div>
          <button onClick={onCloseMobile} className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mb-3"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats…"
              className="glass-input w-full py-2 pl-8 pr-3 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-3">
          {loadingConversations ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-xs text-gray-600 px-2 py-4 text-center">
              {search ? 'No matching chats' : 'No conversations yet'}
            </p>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 px-2 mb-1.5">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((c) => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      active={c.id === activeId}
                      onSelect={() => onSelect(c.id)}
                      onRename={(title) => onRename(c.id, title)}
                      onDelete={() => onDelete(c.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
              <div className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-[10px] font-semibold text-white">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="truncate">{userName}</span>
            </div>
            <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
