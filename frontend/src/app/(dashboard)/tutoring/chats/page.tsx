'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChatThreadList } from '@/features/chat/components/ChatThreadList';
import { ChatThread } from '@/features/chat/components/ChatThread';
import { fetchChats } from '@/features/chat/api/chatApi';
import type { ChatResumen } from '@/features/chat/types';
import { Loader2 } from 'lucide-react';

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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-brand-poli" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-bg-primary text-error">
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
        <div className="flex h-[calc(100vh-4rem)] flex-col bg-bg-primary">
          <header className="flex h-16 items-center gap-3 border-b border-border-color bg-bg-surface px-4">
            <h1 className="text-lg font-semibold text-text-main">Chats</h1>
          </header>
          <div className="flex-1 overflow-y-auto">
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
    <div className="flex h-[calc(100vh-4rem)] bg-bg-primary overflow-hidden">
      {/* Sidebar - Lista de chats */}
      <aside className="w-full md:w-96 lg:w-80 flex flex-col border-r border-border-color bg-bg-surface hidden md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border-color px-4">
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
        <div className="flex-1 overflow-y-auto">
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
          <div className="flex h-full items-center justify-center bg-bg-primary px-6 text-center">
            <div className="max-w-xs">
              <svg className="mx-auto h-16 w-16 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-text-main">Selecciona un chat</h2>
              <p className="mt-2 text-text-muted">Elige una conversación en la lista para empezar a chatear</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}