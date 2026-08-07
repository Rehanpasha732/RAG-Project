'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Menu, Bot, Loader2 } from 'lucide-react';
import MessageBubble, { ChatMessage } from './MessageBubble';

interface ChatWindowProps {
  title: string;
  messages: ChatMessage[];
  isTyping: boolean;
  loadingHistory: boolean;
  onSend: (text: string) => void;
  onOpenMobileSidebar: () => void;
}

export default function ChatWindow({ title, messages, isTyping, loadingHistory, onSend, onOpenMobileSidebar }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
        <button onClick={onOpenMobileSidebar} className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-semibold truncate">{title}</h2>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5 max-w-3xl w-full mx-auto">
        {loadingHistory ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="flex gap-3 animate-slide-up">
                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <form onSubmit={submit} className="px-4 py-4 border-t border-white/5">
        <div className="max-w-3xl w-full mx-auto flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something about your documents…"
            disabled={isTyping}
            className="glass-input flex-1 py-3.5 px-5 text-sm disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="btn-primary !py-3.5 !px-5 flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
