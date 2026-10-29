'use client';

import { ChatThreadList } from '@/features/chat/components/ChatThreadList';

export default function ChatsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-text-main">Mis chats</h1>
      <ChatThreadList />
    </div>
  );
}