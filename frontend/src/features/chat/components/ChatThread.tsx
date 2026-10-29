'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Loader2, ChevronLeft } from 'lucide-react';
import { fetchChatMessages, sendMessage, markAsRead } from '../api/chatApi';
import { useChatStream } from '../hooks/useChatStream';
import { useChatUnreadStore } from '../stores/useChatUnreadStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Mensaje, MensajesPage, ChatResumen } from '../types';

interface ChatThreadProps {
  asesoriaId: number;
  initialThread?: ChatResumen;
  showBackButton?: boolean;
  onBack?: () => void;
}

// Mensaje optimista para UI inmediata
interface OptimisticMensaje extends Omit<Mensaje, 'clientMessageId'> {
  optimistic?: boolean;
  clientMessageId?: string;
}

function formatFechaGroup(iso: string): string {
  const fecha = parseISO(iso);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);

  if (isSameDay(fecha, hoy)) return 'Hoy';
  if (isSameDay(fecha, ayer)) return 'Ayer';
  return format(fecha, "EEEE d 'de' MMMM", { locale: es });
}

export function ChatThread({ asesoriaId, initialThread, showBackButton, onBack }: ChatThreadProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<OptimisticMensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { setCount, getTotal } = useChatUnreadStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadMessages = useCallback(async (before?: number, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const data: MensajesPage = await fetchChatMessages(asesoriaId, before);
      const serverMessages = data.data.map((m) => ({ ...m, optimistic: false }));
      if (append) {
        setMessages((prev) => [...serverMessages, ...prev]);
      } else {
        setMessages(serverMessages);
      }
      setHasMore(data.pagination.hasMore);
      setNextBefore(data.pagination.nextBefore);
    } catch {
      setError('No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [asesoriaId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleLoadMore = () => {
    if (nextBefore && !loadingMore && hasMore) {
      loadMessages(nextBefore, true);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenido = newMessage.trim();
    if (!contenido || sending) return;

    const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    // Optimistic message - aparece INMEDIATAMENTE
    const optimisticMsg: OptimisticMensaje = {
      id: Date.now(), // temporal, se reemplazará por el real
      asesoriaId,
      emisor: { id: currentUser?.id ?? 0, fullName: 'Tú' },
      contenido,
      createdAt: now,
      clientMessageId,
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    setSending(true);

    try {
      await sendMessage(asesoriaId, { contenido, clientMessageId });
      setSending(false);
    } catch {
      setError('No se pudo enviar el mensaje');
      // Quitar el optimista si falla
      setMessages((prev) => prev.filter((m) => m.clientMessageId !== clientMessageId));
      setSending(false);
    }
  };

  const isOptimistic = (m: OptimisticMensaje): m is OptimisticMensaje & { clientMessageId: string } => m.optimistic === true;

  const getClientMessageId = (m: OptimisticMensaje): string | undefined => {
    if (isOptimistic(m)) return m.clientMessageId;
    return undefined;
  };

  const handleMessageReceived = useCallback((mensaje: Mensaje) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === mensaje.id && !m.optimistic)) return prev;
      const filtered: OptimisticMensaje[] = [];
      for (const m of prev) {
        if (!m.optimistic) {
          filtered.push(m);
        } else if (getClientMessageId(m) !== mensaje.clientMessageId) {
          filtered.push(m);
        }
      }
      return [...filtered, { ...mensaje, optimistic: false }];
    });
    if (initialThread) {
      setCount(asesoriaId, (initialThread.noLeidos ?? 0) + 1);
    }
  }, [asesoriaId, initialThread, setCount]);

  useChatStream(asesoriaId, handleMessageReceived);

  const handleScroll = useCallback(() => {
    if (listRef.current && listRef.current.scrollTop === 0 && hasMore && !loadingMore) {
      handleLoadMore();
    }
  }, [handleLoadMore, hasMore, loadingMore]);

  const markRead = useCallback(async () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    try {
      await markAsRead(asesoriaId, { ultimoMensajeId: lastMsg.id });
      setCount(asesoriaId, 0);
    } catch {
      // ignore
    }
  }, [asesoriaId, messages, setCount]);

  useEffect(() => {
    const timer = setTimeout(markRead, 500);
    return () => clearTimeout(timer);
  }, [messages, markRead]);

  // Agrupar mensajes por fecha para separadores tipo WhatsApp
  const groupedMessages = useMemo(() => {
    const groups: Record<string, OptimisticMensaje[]> = {};
    for (const msg of messages) {
      const key = formatFechaGroup(msg.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    }
    return groups;
  }, [messages]);

  const sortedDates = useMemo(() => Object.keys(groupedMessages).sort((a, b) => {
    const dateA = parseISO(groupedMessages[a][0].createdAt);
    const dateB = parseISO(groupedMessages[b][0].createdAt);
    return dateA.getTime() - dateB.getTime();
  }), [groupedMessages]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-poli" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {showBackButton && onBack && (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border-color bg-bg-surface">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-text-muted hover:text-brand-poli hover:bg-brand-poli/10 transition-colors"
            aria-label="Volver a la lista de chats"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate font-semibold text-text-main">
              {initialThread?.contraparte.fullName}
            </h1>
            <p className="truncate text-sm text-text-muted">
              {initialThread?.materia} — {initialThread?.tema}
            </p>
          </div>
        </header>
      )}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-6"
      >
        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm text-text-muted hover:text-brand-poli disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin inline mr-1" aria-hidden="true" />
              ) : (
                'Cargar mas mensajes'
              )}
            </button>
          </div>
        )}

        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="flex flex-col gap-3">
            {/* Separador de fecha */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 border-t border-border-color" />
              <span className="px-3 text-xs font-medium text-text-muted bg-bg-surface">
                {dateKey}
              </span>
              <div className="flex-1 border-t border-border-color" />
            </div>

            {/* Mensajes del día */}
            <div className="flex flex-col gap-3">
              {groupedMessages[dateKey].map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.emisor.id === initialThread?.contraparte.id ? '' : 'flex-row-reverse'} ${msg.optimistic ? 'opacity-70' : ''}`}
                >
                  <div
                    className={`flex max-w-[75%] flex-col ${msg.emisor.id === initialThread?.contraparte.id ? '' : 'items-end'}`}
                  >
                    <div
                      className={`rounded-3xl px-4 py-2.5 shadow-sm ${
                        msg.emisor.id === initialThread?.contraparte.id
                          ? 'bg-brand-poli/15 text-text-main rounded-bl-xl border border-brand-poli/20'
                          : 'bg-brand-poli text-white rounded-br-xl'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.contenido}</p>
                    </div>
                    <p className={`mt-1 text-xs text-text-muted ${msg.emisor.id === initialThread?.contraparte.id ? 'ml-1' : 'mr-1'}`}>
                      {format(parseISO(msg.createdAt), 'HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {initialThread?.permiteEscritura && (
        <form onSubmit={handleSend} className="border-t border-border-color p-4 bg-bg-surface">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 min-h-[44px] rounded-lg border border-border-color bg-bg-surface px-4 py-2 pr-10 text-base text-text-main placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={2000}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-poli px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </form>
      )}

      {!initialThread?.permiteEscritura && (
        <div className="border-t border-border-color p-4 bg-bg-surface text-center text-sm text-text-muted">
          {initialThread?.estado === 'CANCELADA' ? (
            'Esta asesoria fue cancelada. No se pueden enviar mensajes.'
          ) : (
            'Esta asesoria ha finalizado. El chat es de solo lectura.'
          )}
        </div>
      )}
    </div>
  );
}