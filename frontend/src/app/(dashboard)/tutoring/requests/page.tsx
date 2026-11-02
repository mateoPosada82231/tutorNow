'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { CalendarCheck2, History, Inbox, Plus, GraduationCap, User, X } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AcceptedRequestCard } from '@/features/tutoring/components/AcceptedRequestCard';
import { HistoryCard } from '@/features/tutoring/components/HistoryCard';
import { RequestCard } from '@/features/tutoring/components/RequestCard';
import { fetchTutoringRequests, fetchAcceptedTutoringRequests, fetchCatalogoMaterias } from '@/features/tutoring/api/tutoringApi';
import type { TutoringRequest, TutoringRequestFilters, VistaSolicitudes, CatalogItem, AsesoriaEstado, SolicitudEstado } from '@/features/tutoring/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { HttpError } from '@/lib/httpClient';

const TABS: readonly { value: VistaSolicitudes; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'abiertas', label: 'Por aceptar', Icon: Inbox },
  { value: 'coordinacion', label: 'En coordinación', Icon: CalendarCheck2 },
  { value: 'historial', label: 'Historial', Icon: History },
] as const;

const STUDENT_COPY: Record<
  VistaSolicitudes,
  { subtitle: string; emptyTitle: string; emptyDescription: string }
> = {
  abiertas: {
    subtitle:
      'Gestiona las asesorias que publicaste: revisa las propuestas de los tutores y acepta la que mejor se ajuste a ti.',
    emptyTitle: 'Todavia no has publicado asesorias',
    emptyDescription: 'Publica tu primera asesoria para que los tutores te envien propuestas.',
  },
  coordinacion: {
    subtitle:
      'Estas son las asesorias que ya tienen un tutor. Confirma la finalizacion cuando se realicen o cancelalas si es necesario.',
    emptyTitle: 'No tienes asesorias en coordinacion',
    emptyDescription: 'Cuando aceptes la propuesta de un tutor, la asesoria aparecera aqui.',
  },
  historial: {
    subtitle:
      'Aqui encuentras las asesorias finalizadas y canceladas. Esta vista es solo de consulta.',
    emptyTitle: 'Tu historial esta vacio',
    emptyDescription: 'Aqui apareceran las asesorias finalizadas y canceladas.',
  },
};

const TUTOR_SUBTITLE = 'Revisa las solicitudes de los estudiantes y envia propuestas. Aqui van primero las que ajustan a tu perfil.';

const ASESORIA_ESTADOS: readonly AsesoriaEstado[] = ['PENDIENTE', 'FINALIZADA', 'EVALUADA', 'CANCELADA'] as const;

function parseVista(value: string | null): VistaSolicitudes {
  return value === 'coordinacion' || value === 'historial' ? value : 'abiertas';
}

function vistaHref(vista: VistaSolicitudes): string {
  return vista === 'abiertas' ? '/tutoring/requests' : `/tutoring/requests?vista=${vista}`;
}

export default function TutoringRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <TutoringRequestsContent />
    </Suspense>
  );
}

function TutoringRequestsContent() {
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';
  const searchParams = useSearchParams();

  const [materias, setMaterias] = useState<CatalogItem[]>([]);
  const [materiasLoading, setMateriasLoading] = useState(true);

  useEffect(() => {
    setMateriasLoading(true);
    fetchCatalogoMaterias()
      .then(setMaterias)
      .catch(() => {})
      .finally(() => setMateriasLoading(false));
  }, []);

  if (isTutor) {
    const [tutorTab, setTutorTab] = useState<'tutor' | 'estudiante'>('tutor');
    const tutorVista = parseVista(searchParams.get('vista'));

    const [tutorRequests, setTutorRequests] = useState<TutoringRequest[]>([]);
    const [tutorLoading, setTutorLoading] = useState(true);
    const [tutorError, setTutorError] = useState<string | null>(null);
    const [tutorFilters, setTutorFilters] = useState<TutoringRequestFilters>({
      page: 0,
      size: 20,
    });

    const loadTutorRequests = useCallback(async () => {
      setTutorLoading(true);
      setTutorError(null);
      try {
        const page = await fetchAcceptedTutoringRequests(tutorFilters.page, tutorFilters.size, tutorFilters.estado, tutorFilters.materiaId);
        setTutorRequests(page.data);
      } catch (err) {
        setTutorError(
          err instanceof HttpError
            ? err.message
            : 'No pudimos cargar las asesorias. Intenta de nuevo.',
        );
      } finally {
        setTutorLoading(false);
      }
    }, [tutorFilters]);

    useEffect(() => {
      void loadTutorRequests();
    }, [loadTutorRequests]);

    const [estudianteRequests, setEstudianteRequests] = useState<TutoringRequest[]>([]);
    const [estudianteLoading, setEstudianteLoading] = useState(true);
    const [estudianteError, setEstudianteError] = useState<string | null>(null);
    const [estudianteFilters, setEstudianteFilters] = useState<TutoringRequestFilters>({
      vista: tutorVista,
      page: 0,
      size: 20,
    });

    const loadEstudianteRequests = useCallback(async () => {
      setEstudianteLoading(true);
      setEstudianteError(null);
      try {
        const page = await fetchTutoringRequests(estudianteFilters);
        setEstudianteRequests(page.data);
      } catch (err) {
        setEstudianteError(
          err instanceof HttpError
            ? err.message
            : 'No pudimos cargar las asesorias. Intenta de nuevo.',
        );
      } finally {
        setEstudianteLoading(false);
      }
    }, [estudianteFilters]);

    useEffect(() => {
      void loadEstudianteRequests();
    }, [loadEstudianteRequests]);

    const tutorHasActiveFilters = tutorFilters.estado || tutorFilters.materiaId || tutorFilters.q;
    const estudianteHasActiveFilters = estudianteFilters.materiaId || estudianteFilters.q;

    const activeRequests = tutorTab === 'tutor' ? tutorRequests : estudianteRequests;
    const activeLoading = tutorTab === 'tutor' ? tutorLoading : estudianteLoading;
    const activeError = tutorTab === 'tutor' ? tutorError : estudianteError;
    const activeHasFilters = tutorTab === 'tutor' ? tutorHasActiveFilters : estudianteHasActiveFilters;

    return (
      <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-shadow duration-300 md:p-8">
          <span className="absolute -right-12 -top-12 h-40 w-44 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                Asesoria entre pares
              </span>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">Mis asesorias</h1>
                <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">
                  {tutorTab === 'tutor'
                    ? 'Asesorias en las que participas como tutor. Filtra por estado o materia.'
                    : 'Asesorias que publicaste como estudiante. Usa las pestañas y filtros.'}
                </p>
              </div>
            </div>
            <Link
              href="/tutoring/requests/new"
              className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Publicar asesoria
            </Link>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-color pb-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Division tutor / estudiante">
            <button
              role="tab"
              aria-selected={tutorTab === 'tutor'}
              onClick={() => { setTutorTab('tutor'); setTutorFilters(p => ({ ...p, page: 0 })); }}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                tutorTab === 'tutor'
                  ? 'bg-brand-poli text-white'
                  : 'border border-border-color bg-bg-surface text-text-muted hover:border-brand-poli hover:text-brand-poli'
              }`}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Como tutor
            </button>
            <button
              role="tab"
              aria-selected={tutorTab === 'estudiante'}
              onClick={() => { setTutorTab('estudiante'); setEstudianteFilters(p => ({ ...p, page: 0 })); }}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                tutorTab === 'estudiante'
                  ? 'bg-brand-poli text-white'
                  : 'border border-border-color bg-bg-surface text-text-muted hover:border-brand-poli hover:text-brand-poli'
              }`}
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Como estudiante
            </button>
          </div>
        </div>

        {tutorTab === 'tutor' ? (
          <div className="mb-6 flex flex-col gap-3 border border-border-color bg-bg-surface rounded-xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:flex-1">
                <Input
                  id="tutor-search"
                  label="Buscar"
                  placeholder="Buscar por tema, materia..."
                  value={tutorFilters.q ?? ''}
                  onChange={(e) => setTutorFilters((p) => ({ ...p, q: e.target.value || undefined, page: 0 }))}
                />
              </div>
              <Select
                id="tutor-estado"
                label="Estado"
                placeholder="Todos los estados"
                options={ASESORIA_ESTADOS.map((e) => ({ value: e, label: e }))}
                value={tutorFilters.estado ?? ''}
                onChange={(e) => setTutorFilters((p) => ({ ...p, estado: (e.target.value as AsesoriaEstado | SolicitudEstado) || undefined, page: 0 }))}
              />
              <Select
                id="tutor-materia"
                label="Materia"
                placeholder="Todas las materias"
                options={materias.map((m) => ({ value: m.id, label: m.label }))}
                value={tutorFilters.materiaId ?? ''}
                onChange={(e) => setTutorFilters((p) => ({ ...p, materiaId: e.target.value ? Number(e.target.value) : undefined, page: 0 }))}
              />
              {tutorHasActiveFilters && (
                <button
                  onClick={() => setTutorFilters({ page: 0, size: 20 })}
                  className="inline-flex items-center gap-1 min-h-[44px] self-end px-4 py-2 text-sm font-medium text-text-muted hover:text-brand-poli transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <nav aria-label="Vistas de asesorias" className="flex flex-wrap gap-2">
              {TABS.map(({ value, label, Icon }) => {
                const active = tutorVista === value;
                return (
                  <Link
                    key={value}
                    href={vistaHref(value)}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                      active
                        ? 'border-brand-poli bg-brand-poli text-white'
                        : 'border-border-color bg-bg-surface text-text-muted hover:border-brand-poli hover:text-brand-poli'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mb-6 flex flex-col gap-3 border border-border-color bg-bg-surface rounded-xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:flex-1">
                  <Input
                    id="estudiante-search"
                    label="Buscar"
                    placeholder="Buscar por tema, materia..."
                    value={estudianteFilters.q ?? ''}
                    onChange={(e) => setEstudianteFilters((p) => ({ ...p, q: e.target.value || undefined, page: 0 }))}
                  />
                </div>
                <Select
                  id="estudiante-materia"
                  label="Materia"
                  placeholder="Todas las materias"
                  options={materias.map((m) => ({ value: m.id, label: m.label }))}
                  value={estudianteFilters.materiaId ?? ''}
                  onChange={(e) => setEstudianteFilters((p) => ({ ...p, materiaId: e.target.value ? Number(e.target.value) : undefined, page: 0 }))}
                />
                {estudianteHasActiveFilters && (
                  <button
                    onClick={() => setEstudianteFilters((p) => ({ ...p, vista: tutorVista, page: 0, size: 20 }))}
                    className="inline-flex items-center gap-1 min-h-[44px] self-end px-4 py-2 text-sm font-medium text-text-muted hover:text-brand-poli transition-colors"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {activeLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : activeError ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <Alert type="error">{activeError}</Alert>
            <button
              type="button"
              onClick={() => void (tutorTab === 'tutor' ? loadTutorRequests() : loadEstudianteRequests())}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
            >
              Reintentar
            </button>
          </div>
        ) : activeRequests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-color bg-bg-surface p-8 text-center transition-colors duration-200">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-poli/10 text-brand-poli">
              {tutorTab === 'tutor' ? (
                <User className="h-6 w-6" aria-hidden="true" />
              ) : tutorVista === 'coordinacion' ? (
                <CalendarCheck2 className="h-6 w-6" aria-hidden="true" />
              ) : tutorVista === 'historial' ? (
                <History className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Inbox className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <h2 className="text-base font-semibold text-text-main">
              {tutorTab === 'tutor'
                ? 'Aun no tienes asesorias como tutor'
                : STUDENT_COPY[tutorVista].emptyTitle}
            </h2>
            <p className="max-w-md text-sm text-text-muted">
              {tutorTab === 'tutor'
                ? 'Cuando un estudiante acepte tu propuesta, la veras aqui con su estado.'
                : STUDENT_COPY[tutorVista].emptyDescription}
            </p>
            {(tutorTab === 'estudiante' && tutorVista === 'abiertas') && (
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
            {activeRequests.map((request) => (
              <li key={request.id}>
                {tutorTab === 'tutor' ? (
                  <AcceptedRequestCard request={request} onUpdated={loadTutorRequests} />
                ) : tutorVista === 'coordinacion' ? (
                  <AcceptedRequestCard
                    request={request}
                    detailHref={`/tutoring/requests/${request.id}?from=requests&vista=coordinacion`}
                    onUpdated={loadEstudianteRequests}
                  />
                ) : tutorVista === 'historial' ? (
                  <HistoryCard
                    request={request}
                    detailHref={`/tutoring/requests/${request.id}?from=requests&vista=historial`}
                  />
                ) : (
                  <RequestCard request={request} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const vista = parseVista(searchParams.get('vista'));

  const [requests, setRequests] = useState<TutoringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TutoringRequestFilters>({
    vista,
    page: 0,
    size: 20,
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const page = await fetchTutoringRequests(filters);
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
  }, [filters]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const copy = STUDENT_COPY[vista];
  const EmptyIcon = TABS.find((tab) => tab.value === vista)!.Icon;
  const hasActiveFilters = filters.materiaId || filters.q;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-shadow duration-300 md:p-8">
        <span className="absolute -right-12 -top-12 h-40 w-44 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              Encuentra ayuda
            </span>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Mis asesorias</h1>
              <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">{copy.subtitle}</p>
            </div>
          </div>
          <Link
            href="/tutoring/requests/new"
            className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Publicar asesoria
          </Link>
        </div>
      </section>

      <nav aria-label="Vistas de asesorias" className="flex flex-wrap gap-2">
        {TABS.map(({ value, label, Icon }) => {
          const active = vista === value;
          return (
            <Link
              key={value}
              href={vistaHref(value)}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                active
                  ? 'border-brand-poli bg-brand-poli text-white'
                  : 'border-border-color bg-bg-surface text-text-muted hover:border-brand-poli hover:text-brand-poli'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-6 flex flex-col gap-3 border border-border-color bg-bg-surface rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:flex-1">
            <Input
              id="estudiante-search-main"
              label="Buscar"
              placeholder="Buscar por tema, materia..."
              value={filters.q ?? ''}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value || undefined, page: 0 }))}
            />
          </div>
          <Select
            id="estudiante-materia-main"
            label="Materia"
            placeholder="Todas las materias"
            options={materias.map((m) => ({ value: m.id, label: m.label }))}
            value={filters.materiaId ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, materiaId: e.target.value ? Number(e.target.value) : undefined, page: 0 }))}
          />
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ vista, page: 0, size: 20 })}
              className="inline-flex items-center gap-1 min-h-[44px] self-end px-4 py-2 text-sm font-medium text-text-muted hover:text-brand-poli transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Limpiar
            </button>
          )}
        </div>
      </div>

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
            <EmptyIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-text-main">{copy.emptyTitle}</h2>
          <p className="max-w-md text-sm text-text-muted">{copy.emptyDescription}</p>
          {vista === 'abiertas' && (
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
              {vista === 'abiertas' ? (
                <RequestCard request={request} />
              ) : vista === 'coordinacion' ? (
                <AcceptedRequestCard
                  request={request}
                  detailHref={`/tutoring/requests/${request.id}?from=requests&vista=coordinacion`}
                  onUpdated={loadRequests}
                />
              ) : (
                <HistoryCard
                  request={request}
                  detailHref={`/tutoring/requests/${request.id}?from=requests&vista=historial`}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}