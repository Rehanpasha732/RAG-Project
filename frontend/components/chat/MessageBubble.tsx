'use client';

import { Bot, User, FileText } from 'lucide-react';
import clsx from 'clsx';
import type { AskSource } from '@/lib/api';
import { dedupeSources } from '@/lib/sources';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: AskSource[];
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex gap-3 animate-slide-up', isUser && 'flex-row-reverse')}>
      <div
        className={clsx(
          'w-8 h-8 shrink-0 rounded-full flex items-center justify-center',
          isUser ? 'bg-white/10 border border-white/10' : 'bg-gradient-to-br from-teal-500 to-cyan-500'
        )}
      >
        {isUser ? <User className="w-4 h-4 text-gray-300" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className="max-w-[75%] space-y-2">
        <div
          className={clsx(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
              : 'bg-white/5 border border-white/10 text-gray-200'
          )}
        >
          {message.text}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dedupeSources(message.sources).map((source, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-teal-500/10 border border-teal-500/20 text-teal-300"
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
  );
}
