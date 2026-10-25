import Link from 'next/link';
import { ArrowRight, CalendarCheck2, CheckCircle2 } from 'lucide-react';
import type { TutoringRequest } from '../types';

const modalidadLabels: Record<TutoringRequest['modalidad'], string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
};

interface AcceptedRequestCardProps {
  request: TutoringRequest;
}

function formatFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

export function AcceptedRequestCard({ request }: AcceptedRequestCardProps) {
  const acceptedAt = request.asesoria?.createdAt ?? request.createdAt;
  const fechaAceptada = formatFecha(acceptedAt);

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-success hover:shadow-lg md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Confirmada
        </span>
        <span className="inline-flex items-center rounded-full border border-border-color bg-bg-primary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
          {modalidadLabels[request.modalidad]}
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-main">{request.tema}</h3>
        <p className="mt-1 text-sm text-text-muted">{request.materia.label}</p>
      </div>

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2">
          <dt className="shrink-0 font-medium text-text-muted">Estudiante:</dt>
          <dd className="truncate text-text-main">{request.estudiante.fullName}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="shrink-0 font-medium text-text-muted">Disponibilidad:</dt>
          <dd className="truncate text-text-main">{request.disponibilidad}</dd>
        </div>
        {fechaAceptada && (
          <div className="flex items-center gap-2">
            <dt className="shrink-0 font-medium text-text-muted">Aceptada el:</dt>
            <dd className="inline-flex items-center gap-1 text-text-main">
              <CalendarCheck2 className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
              {fechaAceptada}
            </dd>
          </div>
        )}
      </dl>

      {request.descripcion && (
        <p className="rounded-lg bg-bg-primary p-3 text-sm text-text-muted">
          {request.descripcion}
        </p>
      )}

      <div className="mt-auto flex items-center justify-end pt-2">
        <Link
          href={`/tutoring/requests/${request.id}`}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-poli transition-colors duration-200 hover:bg-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
        >
          Ver asesoría
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
