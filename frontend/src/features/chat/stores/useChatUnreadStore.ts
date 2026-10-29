'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatUnreadState {
  unreadCounts: Record<number, number>;
  increment: (asesoriaId: number) => void;
  setCount: (asesoriaId: number, count: number) => void;
  getTotal: () => number;
}

export const useChatUnreadStore = create<ChatUnreadState>()(
  persist(
    (set, get) => ({
      unreadCounts: {},
      increment: (asesoriaId: number) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [asesoriaId]: (state.unreadCounts[asesoriaId] ?? 0) + 1,
          },
        })),
      setCount: (asesoriaId: number, count: number) =>
        set((state) => {
          const next = { ...state.unreadCounts };
          if (count <= 0) {
            delete next[asesoriaId];
          } else {
            next[asesoriaId] = count;
          }
          return { unreadCounts: next };
        }),
      getTotal: () => {
        const counts = get().unreadCounts;
        return Object.values(counts).reduce((sum, c) => sum + c, 0);
      },
    }),
    { name: 'tutornow-chat-unread' },
  ),
);