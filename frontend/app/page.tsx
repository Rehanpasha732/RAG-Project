'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import EmptyState from '@/components/chat/EmptyState';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/lib/api';
import * as conversationApi from '@/lib/conversationApi';
import type { ConversationSummary } from '@/lib/conversationApi';
import type { ChatMessage } from '@/components/chat/MessageBubble';

function ChatShell() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await conversationApi.listConversations();
      setConversations(res.conversations);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      toast.error(message);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const selectConversation = async (id: string) => {
    setActiveId(id);
    setMobileSidebarOpen(false);
    setLoadingHistory(true);
    try {
      const res = await conversationApi.getConversation(id);
      setMessages(
        res.conversation.messages.map((m, i) => ({
          id: `${id}-${i}`,
          role: m.role,
          text: m.text,
          sources: m.sources,
        }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load conversation';
      toast.error(message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setMobileSidebarOpen(false);
  };

  const sendMessage = async (text: string) => {
    setIsTyping(true);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);

    let conversationId = activeId;

    try {
      if (!conversationId) {
        const created = await conversationApi.createConversation();
        conversationId = created.conversation.id;
        setActiveId(conversationId);
        setConversations((c) => [created.conversation, ...c]);
      }

      const res = await api.askQuestion(text);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'assistant', text: res.answer, sources: res.sources },
      ]);

      const appended = await conversationApi.appendMessages(conversationId, text, res.answer, res.sources);
      setConversations((c) => {
        const others = c.filter((x) => x.id !== conversationId);
        return [{ ...appended.conversation }, ...others];
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'assistant', text: "Sorry, I couldn't get an answer right now. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await conversationApi.renameConversation(id, title);
      setConversations((c) => c.map((x) => (x.id === id ? { ...x, title } : x)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rename failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await conversationApi.deleteConversation(id);
      setConversations((c) => c.filter((x) => x.id !== id));
      if (id === activeId) {
        setActiveId(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    }
  };

  return (
    <main className="h-screen flex overflow-hidden bg-[#0b0f14]">
      <Sidebar
        conversations={conversations}
        loadingConversations={loadingConversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNewChat={startNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
        userName={user?.name}
        onLogout={logout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {activeId ? (
        <ChatWindow
          title={conversations.find((c) => c.id === activeId)?.title || 'Chat'}
          messages={messages}
          isTyping={isTyping}
          loadingHistory={loadingHistory}
          onSend={sendMessage}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 md:hidden">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <span className="font-semibold">Cortex</span>
          </header>
          <EmptyState onSuggestion={sendMessage} />
        </div>
      )}
    </main>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <ChatShell />
    </ProtectedRoute>
  );
}
