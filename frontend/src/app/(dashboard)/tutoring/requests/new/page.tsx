'use client';

import Link from 'next/link';
import { PublishRequestForm } from '@/features/tutoring/components/PublishRequestForm';
import { useAuthStore } from '@/stores/useAuthStore';

export default function NewTutoringRequestPage() {
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-colors duration-300 md:p-8">
        <span
          className="absolute -right-12 -top-12 h-40 w-44 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            Nueva solicitud
          </span>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {isTutor ? 'Publicar demanda' : 'Publicar asesoria'}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">
              {isTutor
                ? 'Aunque seas tutor, tambien puedes necesitar ayuda en materias que no manejas. Explica tu tema y recibiras propuestas de otros tutores.'
                : 'Cuentale a los tutores que necesitas, donde y cuando puedes. Recibiras propuestas de quienes puedan ayudarte.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6">
        <PublishRequestForm />
      </section>
    </div>
  );
}
