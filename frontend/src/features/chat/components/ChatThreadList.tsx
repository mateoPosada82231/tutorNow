'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { fetchChats } from '../api/chatApi';
import { useChatUnreadStore } from '../stores/useChatUnreadStore';
import type { ChatResumen } from '../types';
import { ChatThreadCard } from './ChatThreadCard';

export function ChatThreadList() {
  const [threads, setThreads] = useState<ChatResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { unreadCounts, setCount, getTotal } = useChatUnreadStore();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchChats();
        if (mounted) {
          setThreads(data);
          for (const t of data) {
            if (unreadCounts[t.asesoriaId] !== undefined && unreadCounts[t.asesoriaId] !== t.noLeidos) {
              setCount(t.asesoriaId, t.noLeidos);
            }
          }
        }
      } catch (err) {
        if (mounted) setError('No se pudieron cargar los chats');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [unreadCounts, setCount]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-poli" aria-hidden="true" />
        <p className="text-text-muted">Cargando chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <MessageSquare className="h-12 w-12 text-text-muted" aria-hidden="true" />
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <MessageSquare className="h-12 w-12 text-text-muted" aria-hidden="true" />
        <p className="text-text-main">No tienes chats activos</p>
        <p className="text-sm text-text-muted">
          Los chats aparecen aqui cuando aceptas una propuesta o la tuya es aceptada
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {threads.map((thread) => (
        <ChatThreadCard key={thread.asesoriaId} thread={thread} />
      ))}
    </div>
  );
}