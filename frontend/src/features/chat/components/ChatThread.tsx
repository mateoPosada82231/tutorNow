'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Loader2 } from 'lucide-react';
import { fetchChatMessages, sendMessage, markAsRead } from '../api/chatApi';
import { useChatStream } from '../hooks/useChatStream';
import { useChatUnreadStore } from '../stores/useChatUnreadStore';
import type { Mensaje, MensajesPage, ChatResumen } from '../types';

interface ChatThreadProps {
  asesoriaId: number;
  initialThread?: ChatResumen;
}

export function ChatThread({ asesoriaId, initialThread }: ChatThreadProps) {
  const [messages, setMessages] = useState<Mensaje[]>([]);
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
      if (append) {
        setMessages((prev) => [...data.data, ...prev]);
      } else {
        setMessages(data.data);
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
    setSending(true);
    try {
      await sendMessage(asesoriaId, { contenido, clientMessageId });
      setNewMessage('');
    } catch {
      setError('No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleMessageReceived = useCallback((mensaje: Mensaje) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === mensaje.id)) return prev;
      return [...prev, mensaje];
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-poli" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
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

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.emisor.id === initialThread?.contraparte.id ? '' : 'flex-row-reverse'}`}
          >
            <div
              className={`flex max-w-[75%] flex-col ${msg.emisor.id === initialThread?.contraparte.id ? '' : 'items-end'}`}
            >
              <div
                className={`rounded-2xl px-4 py-2 ${
                  msg.emisor.id === initialThread?.contraparte.id
                    ? 'bg-brand-poli/10 text-text-main rounded-bl-none'
                    : 'bg-brand-poli text-white rounded-br-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.contenido}</p>
              </div>
              <p className={`mt-1 text-xs text-text-muted ${msg.emisor.id === initialThread?.contraparte.id ? 'ml-1' : 'mr-1'}`}>
                {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
              </p>
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
              className="flex-1 rounded-lg border border-border-color bg-bg-main px-4 py-2 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-poli"
              maxLength={2000}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="flex h-10 min-w-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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