'use client';

import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const ready = useRequireAuth();
  const pathname = usePathname();
  const isChatRoute = pathname?.startsWith('/tutoring/chats') ?? false;

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (isChatRoute) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <Navbar />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-10">{children}</main>
    </div>
  );
}
