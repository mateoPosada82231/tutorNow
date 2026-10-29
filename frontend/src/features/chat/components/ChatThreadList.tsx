'use client';

import { Loader2, MessageSquare } from 'lucide-react';
import { useChatUnreadStore } from '../stores/useChatUnreadStore';
import type { ChatResumen } from '../types';
import { ChatThreadCard } from './ChatThreadCard';

interface ChatThreadListProps {
  threads: ChatResumen[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ChatThreadList({ threads, selectedId, onSelect }: ChatThreadListProps) {
  const { unreadCounts, setCount } = useChatUnreadStore();

  // Sync unread counts when threads prop changes
  // (could be done in parent, but keep here for completeness)
  // Not using useEffect to avoid extra deps; assume parent passes latest.

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center flex-1">
        <MessageSquare className="h-12 w-12 text-text-muted" aria-hidden="true" />
        <p className="text-text-main">No tienes chats activos</p>
        <p className="text-sm text-text-muted">
          Los chats aparecen aquí cuando aceptas una propuesta o la tuya es aceptada
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1">
      {threads.map((thread) => (
        <ChatThreadCard
          key={thread.asesoriaId}
          thread={thread}
          isSelected={thread.asesoriaId === selectedId}
          onClick={() => onSelect(thread.asesoriaId)}
        />
      ))}
    </div>
  );
}