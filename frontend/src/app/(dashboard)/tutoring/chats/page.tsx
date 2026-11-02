'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChatThreadList } from '@/features/chat/components/ChatThreadList';
import { ChatThread } from '@/features/chat/components/ChatThread';
import { fetchChats } from '@/features/chat/api/chatApi';
import type { ChatResumen } from '@/features/chat/types';
import { Loader2, MessageSquare } from 'lucide-react';

export default function ChatsSplitView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialChatId = searchParams.get('chat') ? Number(searchParams.get('chat')) : null;

  const [threads, setThreads] = useState<ChatResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(initialChatId);
  const [error, setError] = useState<string | null>(null);

  // Detect mobile - MUST be before any early returns
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load thread list once
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchChats();
        if (mounted) setThreads(data);
      } catch {
        if (mounted) setError('No se pudieron cargar los chats');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Sync URL when selectedId changes
  useEffect(() => {
    if (selectedId !== null) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('chat', String(selectedId));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('chat');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedId, pathname, router, searchParams]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleBack = () => {
    setSelectedId(null);
  };

  // Early returns - AFTER all hooks
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-brand-poli" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-primary text-error">
        {error}
      </div>
    );
  }

  // ============================================================
  // MOBILE: WhatsApp-style navigation
  // ============================================================
  if (isMobile) {
    // Mobile: Show either thread list OR chat thread (mutually exclusive)
    if (selectedId === null) {
      // --- THREAD LIST (full screen) ---
      return (
        <div className="flex h-full flex-col bg-bg-primary">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-color bg-bg-surface px-4">
            <h1 className="text-lg font-semibold text-text-main">Chats</h1>
          </header>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <ChatThreadList
              threads={threads}
              selectedId={null}
              onSelect={handleSelect}
            />
          </div>
        </div>
      );
    } else {
      // --- CHAT THREAD (full screen with back button) ---
      const thread = threads.find(t => t.asesoriaId === selectedId);
      return (
        <ChatThread
          asesoriaId={selectedId}
          initialThread={thread}
          showBackButton={true}
          onBack={handleBack}
        />
      );
    }
  }

  // ============================================================
  // DESKTOP: Split view (sidebar + thread)
  // ============================================================
  return (
    <div className="flex h-full bg-bg-primary overflow-hidden">
      {/* Sidebar - Lista de chats */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-border-color bg-bg-surface">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border-color bg-bg-surface px-4">
          <h1 className="text-lg font-semibold text-text-main">Chats</h1>
          {selectedId !== null && (
            <button
              onClick={handleBack}
              className="ml-auto p-1 rounded hover:bg-brand-poli/10 text-text-muted transition-colors"
              aria-label="Cerrar chat"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <ChatThreadList
            threads={threads}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
      </aside>

      {/* Área del chat activo */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedId !== null ? (
          <ChatThread
            asesoriaId={selectedId}
            initialThread={threads.find(t => t.asesoriaId === selectedId)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-bg-primary text-center">
            <div className="max-w-xs">
              <MessageSquare className="mx-auto h-16 w-16 text-text-muted" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-text-main">Selecciona un chat</h2>
              <p className="mt-2 text-text-muted">Elige una conversación en la lista para empezar a chatear</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}