'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchChats } from '@/features/chat/api/chatApi';
import { ChatThread } from '@/features/chat/components/ChatThread';
import type { ChatResumen } from '@/features/chat/types';

export default function ChatThreadPage() {
  const params = useParams();
  const asesoriaId = Number(params.asesoriaId);
  const [thread, setThread] = useState<ChatResumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const threads = await fetchChats();
        const found = threads.find((t) => t.asesoriaId === asesoriaId);
        if (mounted) setThread(found ?? null);
      } catch {
        if (mounted) setThread(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [asesoriaId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-poli" aria-hidden="true" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center px-4">
        <ArrowLeft className="h-10 w-10 text-text-muted" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-text-main">Chat no encontrado</h2>
        <p className="text-text-muted">Esta asesoria no existe o no tienes acceso a ella</p>
        <Link href="/tutoring/chats" className="mt-4 rounded-lg bg-brand-poli px-4 py-2 font-medium text-white hover:bg-brand-poli/90">
          Volver a mis chats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="border-b border-border-color bg-bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/tutoring/chats"
            className="p-1 text-text-muted hover:text-brand-poli"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="truncate font-semibold text-text-main">{thread.contraparte.fullName}</h1>
            <p className="truncate text-sm text-text-muted">{thread.materia} — {thread.tema}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            thread.estado === 'PENDIENTE' ? 'bg-brand-poli/10 text-brand-poli' :
            thread.estado === 'FINALIZADA' ? 'bg-green-500/10 text-green-500' :
            thread.estado === 'EVALUADA' ? 'bg-blue-500/10 text-blue-500' :
            'bg-error/10 text-error'
          }`}>
            {thread.estado === 'PENDIENTE' ? 'En curso' :
             thread.estado === 'FINALIZADA' ? 'Finalizada' :
             thread.estado === 'EVALUADA' ? 'Evaluada' : 'Cancelada'}
          </span>
        </div>
      </header>
      <ChatThread asesoriaId={asesoriaId} initialThread={thread} />
    </div>
  );
}