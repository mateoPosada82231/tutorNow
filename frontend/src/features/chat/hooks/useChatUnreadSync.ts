'use client';

import { useEffect } from 'react';
import { fetchChats } from '../api/chatApi';
import { useChatUnreadStore } from '../stores/useChatUnreadStore';

const SYNC_INTERVAL_MS = 30000;

export function useChatUnreadSync(): void {
  useEffect(() => {
    let cancelled = false;

    async function sync(): Promise<void> {
      try {
        const threads = await fetchChats();
        if (cancelled) return;
        for (const thread of threads) {
          useChatUnreadStore.getState().setCount(thread.asesoriaId, thread.noLeidos ?? 0);
        }
      } catch {
        return;
      }
    }

    void sync();
    const interval = setInterval(() => {
      void sync();
    }, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
