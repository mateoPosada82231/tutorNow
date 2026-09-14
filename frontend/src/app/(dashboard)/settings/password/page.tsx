'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import { Spinner } from '@/components/ui/Spinner';

export default function ChangePasswordPage() {
  const ready = useRequireAuth();

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-8 md:max-w-2xl">
      <header className="flex items-center justify-between">
        <span className="text-2xl font-bold text-brand-poli">tutorNow</span>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand-poli underline-offset-4 transition-colors duration-200 hover:underline"
        >
          Volver al panel
        </Link>
      </header>

      <section className="rounded-xl border border-border-color bg-bg-surface p-6">
        <h1 className="mb-4 text-xl font-semibold text-text-main">Cambiar contrasena</h1>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
