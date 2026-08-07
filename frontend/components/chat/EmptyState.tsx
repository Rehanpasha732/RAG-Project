'use client';

import { Sparkles, FileText } from 'lucide-react';

const SUGGESTIONS = [
  'Summarize my uploaded documents',
  'What are the key points in my last file?',
  'Find mentions of pricing',
];

export default function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-5 shadow-lg shadow-teal-500/25">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Chat with your documents</h1>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Start a new chat and ask anything about the documents your admin has uploaded for you.
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-teal-500/40 transition-colors"
          >
            <FileText className="w-3 h-3" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
