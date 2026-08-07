'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import clsx from 'clsx';
import type { ConversationSummary } from '@/lib/conversationApi';

interface ConversationItemProps {
  conversation: ConversationSummary;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export default function ConversationItem({ conversation, active, onSelect, onRename, onDelete }: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveEdit = () => {
    if (editValue.trim()) {
      onRename(editValue.trim());
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="glass-input flex-1 py-1.5 px-2.5 text-sm"
        />
        <button onClick={saveEdit} className="p-1 rounded-lg text-teal-400 hover:bg-white/10">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 rounded-lg text-gray-400 hover:bg-white/10">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'group relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors',
        active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      )}
      onClick={onSelect}
    >
      <span className="flex-1 truncate">{conversation.title}</span>

      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className={clsx(
            'p-1 rounded-lg hover:bg-white/10 transition-opacity',
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 z-20 w-32 py-1 rounded-xl glass-card bg-[#12181f] shadow-xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditValue(conversation.title);
                setEditing(true);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10"
            >
              <Pencil className="w-3.5 h-3.5" /> Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-white/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
