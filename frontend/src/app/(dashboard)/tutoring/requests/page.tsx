'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { RequestCard } from '@/features/tutoring/components/RequestCard';
import { fetchTutoringRequests } from '@/features/tutoring/api/tutoringApi';
import type { TutoringRequest } from '@/features/tutoring/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { HttpError } from '@/lib/httpClient';

export default function TutoringRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';

  const [requests, setRequests] = useState<TutoringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    setLoadError(null);
    try {
      const page = await fetchTutoringRequests();
      setRequests(page.data);
    } catch (err) {
      setLoadError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos cargar las asesorias. Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-shadow duration-300 md:p-8">
        <span
          className="absolute -right-12 -top-12 h-40 w-44 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {isTutor ? 'Asesoria entre pares' : 'Encuentra ayuda'}
            </span>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                {isTutor ? 'Asesorias' : 'Mis asesorias'}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">
                {isTutor
                  ? 'Revisa las solicitudes de los estudiantes y envia propuestas. Aqui van primero las que ajustan a tu perfil.'
                  : 'Gestiona las asesorias que publicaste: revisa las propuestas de los tutores y acepta la que mejor se ajuste a ti.'}
              </p>
            </div>
          </div>
          {!isTutor && (
            <Link
              href="/tutoring/requests/new"
              className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Publicar asesoria
            </Link>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : loadError ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <Alert type="error">{loadError}</Alert>
          <button
            type="button"
            onClick={() => void loadRequests()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
          >
            Reintentar
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-color bg-bg-surface p-8 text-center transition-colors duration-200">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-poli/10 text-brand-poli">
            <Inbox className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-text-main">
            {isTutor ? 'Aun no hay asesorias publicadas' : 'Todavia no has publicado asesorias'}
          </h2>
          <p className="max-w-md text-sm text-text-muted">
            {isTutor
              ? 'En cuanto los estudiantes publiquen lo que necesitan, lo veras aqui primero si ajustan a tu perfil.'
              : 'Publica tu primera asesoria para que los tutores te envien propuestas.'}
          </p>
          {!isTutor && (
            <Link
              href="/tutoring/requests/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
            >
              Publicar asesoria
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <li key={request.id}>
              <RequestCard request={request} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
