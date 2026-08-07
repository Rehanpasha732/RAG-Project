'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, FileText } from 'lucide-react';
import clsx from 'clsx';
import ParticlesBackground from '@/components/ParticlesBackground';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppNav from '@/components/AppNav';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'Summarize my uploaded documents',
  'What are the key points in my last file?',
  'Find mentions of pricing',
];

const MOCK_REPLIES = [
  "This is a UI preview — I'm not connected to your documents yet. Once the backend is wired up, I'll answer using real content from your uploads.",
  "Great question! For now this chat is just a mockup so we can nail the design first — real answers are coming in the next step.",
  "I hear you — right now I'm only showing what the conversation will look like. Retrieval + real answers get wired in next.",
];

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

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
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
          <p className="text-gray-500 text-sm">Preview UI — answers below are mocked for now.</p>
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
              <div
                className={clsx(
                  'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'bot'
                    ? 'bg-white/5 border border-white/10 text-gray-200'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                )}
              >
                {msg.text}
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
            className="glass-input flex-1 py-3.5 px-5 text-sm"
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
