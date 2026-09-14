'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner />
      </main>
    );
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-8 md:max-w-2xl">
      <header className="flex items-center justify-between">
        <span className="text-2xl font-bold text-brand-poli">tutorNow</span>
        <Button type="button" variant="ghost" className="w-auto px-3" onClick={handleLogout}>
          Cerrar sesion
        </Button>
      </header>

      <section className="rounded-xl border border-border-color bg-bg-surface p-6">
        <h1 className="text-xl font-semibold text-text-main">
          Bienvenido, {user?.fullName ?? 'usuario'}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
        <p className="mt-4 text-text-muted">
          El panel de asesorias estara disponible en el proximo sprint.
        </p>
      </section>

      <section className="rounded-xl border border-border-color bg-bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-main">Cuenta</h2>
        <Link href="/settings/password">
          <Button type="button" variant="secondary">
            Cambiar contrasena
          </Button>
        </Link>
      </section>
    </main>
  );
}
