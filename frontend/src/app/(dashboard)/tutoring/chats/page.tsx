'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChatThreadList } from '@/features/chat/components/ChatThreadList';
import { ChatThread } from '@/features/chat/components/ChatThread';
import { fetchChats } from '@/features/chat/api/chatApi';
import type { ChatResumen } from '@/features/chat/types';
import { Loader2, ChevronLeft } from 'lucide-react';

export default function ChatsSplitView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialChatId = searchParams.get('chat') ? Number(searchParams.get('chat')) : null;

  const [threads, setThreads] = useState<ChatResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(initialChatId);
  const [error, setError] = useState<string | null>(null);
  const [mobileThreadListOpen, setMobileThreadListOpen] = useState(false);

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
      // Close mobile thread list when selecting a chat
      setMobileThreadListOpen(false);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('chat');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedId, pathname, router, searchParams]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    // On mobile, close the thread list drawer after selection
    setMobileThreadListOpen(false);
  };

  const handleClose = () => {
    setSelectedId(null);
  };

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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-bg-primary overflow-hidden">
      {/* Sidebar - Lista de chats (Desktop) */}
      <aside className="w-full md:w-96 lg:w-80 flex flex-col border-r border-border-color bg-bg-surface hidden md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border-color px-4">
          <h1 className="text-lg font-semibold text-text-main">Chats</h1>
          {selectedId !== null && (
            <button
              onClick={handleClose}
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

      {/* Mobile: Thread List Drawer */}
      {isMobile && mobileThreadListOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Lista de chats"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileThreadListOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col w-full max-w-sm bg-bg-surface border-r border-border-color">
            <div className="flex h-16 items-center justify-between border-b border-border-color px-4">
              <h1 className="text-lg font-semibold text-text-main">Chats</h1>
              <button
                onClick={() => setMobileThreadListOpen(false)}
                className="p-2 text-text-muted hover:text-brand-poli"
                aria-label="Cerrar"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatThreadList
                threads={threads}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </div>
          </div>
        </div>
      )}

      {/* Área del chat activo */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedId !== null ? (
          <ChatThread
            asesoriaId={selectedId}
            initialThread={threads.find(t => t.asesoriaId === selectedId)}
            showBackButton={isMobile}
            onBack={() => setMobileThreadListOpen(true)}
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

        {/* Mobile: Floating action button to open thread list when chat is open */}
        {isMobile && selectedId !== null && (
          <button
            onClick={() => setMobileThreadListOpen(true)}
            className="fixed bottom-6 right-4 z-40 md:hidden flex h-12 w-12 items-center justify-center rounded-full bg-brand-poli shadow-lg text-white transition-transform duration-200 hover:scale-105"
            aria-label="Abrir lista de chats"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </main>
    </div>
  );
}