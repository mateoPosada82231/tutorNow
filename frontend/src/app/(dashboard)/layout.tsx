'use client';

import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const ready = useRequireAuth();
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith('/tutoring/chats');

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!isChatRoute && <Navbar />}
      <main className={`mx-auto w-full flex-1 ${isChatRoute ? 'max-w-full px-0 py-0' : 'max-w-6xl px-4 py-8 md:py-10'}`}>
        {children}
      </main>
    </div>
  );
}
