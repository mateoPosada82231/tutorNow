'use client';

import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <section className="rounded-2xl border border-border-color bg-bg-surface p-6 shadow-sm transition-colors duration-300">
        <h1 className="mb-4 text-xl font-semibold text-text-main">Cambiar contrasena</h1>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
