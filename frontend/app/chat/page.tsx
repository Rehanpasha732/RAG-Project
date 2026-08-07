'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, Sparkles, Bot, User, FileText } from 'lucide-react';
import clsx from 'clsx';
import ParticlesBackground from '@/components/ParticlesBackground';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppNav from '@/components/AppNav';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/lib/api';
import type { AskSource } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  sources?: AskSource[];
}

const SUGGESTIONS = [
  'Summarize my uploaded documents',
  'What are the key points in my last file?',
  'Find mentions of pricing',
];

function dedupeSources(sources: AskSource[]): AskSource[] {
  const best = new Map<string, AskSource>();
  for (const source of sources) {
    const existing = best.get(source.file_name);
    if (!existing || source.score > existing.score) {
      best.set(source.file_name, source);
    }
  }
  return Array.from(best.values());
}

function ChatContent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your document assistant. Ask me anything about your uploaded files.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.askQuestion(trimmed);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'bot', text: res.answer, sources: res.sources },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'bot',
          text: "Sorry, I couldn't get an answer right now. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">
      <ParticlesBackground />
      <AppNav />

      <div className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Chat with your documents
          </h1>
          <p className="text-gray-500 text-sm">Answers are generated from your own uploaded documents.</p>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="glass-card flex-1 min-h-[50vh] max-h-[60vh] overflow-y-auto p-5 space-y-5"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx('flex gap-3 animate-slide-up', msg.role === 'user' && 'flex-row-reverse')}
            >
              <div
                className={clsx(
                  'w-8 h-8 shrink-0 rounded-full flex items-center justify-center',
                  msg.role === 'bot'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    : 'bg-white/10 border border-white/10'
                )}
              >
                {msg.role === 'bot' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-gray-300" />
                )}
              </div>
              <div className="max-w-[75%] space-y-2">
                <div
                  className={clsx(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'bot'
                      ? 'bg-white/5 border border-white/10 text-gray-200'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  )}
                >
                  {msg.text}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dedupeSources(msg.sources).map((source, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                        title={`Similarity score: ${source.score.toFixed(2)}`}
                      >
                        <FileText className="w-3 h-3" />
                        {source.file_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-indigo-500/40 transition-colors"
              >
                <FileText className="w-3 h-3" />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="mt-4 flex items-center gap-3"
        >
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
        </form>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
