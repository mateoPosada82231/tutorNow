'use client';

import Link from 'next/link';
import { BookOpenCheck, Info } from 'lucide-react';
import { PublishRequestForm } from '@/features/tutoring/components/PublishRequestForm';
import { useAuthStore } from '@/stores/useAuthStore';

export default function NewTutoringRequestPage() {
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-shadow duration-300 md:p-8">
        <span
          className="absolute -right-12 -top-12 h-40 w-44 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            Nueva solicitud
          </span>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Publicar asesoria</h1>
            <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">
              Cuentale a los tutores que necesitas, donde y cuando puedes. Recibiras propuestas de
              quienes puedan ayudarte.
            </p>
          </div>
        </div>
      </section>

      {isTutor ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-border-color bg-bg-surface p-8 shadow-sm transition-colors duration-300">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white shadow-md">
            <Info className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-text-main">
              Solo los estudiantes publican asesorias
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Como tutor puedes revisar las solicitudes publicadas y enviar propuestas para
              asesorar.
            </p>
          </div>
          <Link
            href="/tutoring/requests"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
          >
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            Ver asesorias
          </Link>
        </div>
      ) : (
        <section className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6">
          <PublishRequestForm />
        </section>
      )}
    </div>
  );
}
