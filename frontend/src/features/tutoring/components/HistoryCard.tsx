import Link from 'next/link';
import { ArrowRight, CalendarCheck2 } from 'lucide-react';
import type { TutoringRequest } from '../types';
import { estadoCiclo } from '../lib/estadoCiclo';

const modalidadLabels: Record<TutoringRequest['modalidad'], string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
};

interface HistoryCardProps {
  request: TutoringRequest;
  detailHref?: string;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/**
 * Tarjeta de solo lectura para las asesorias finalizadas o canceladas del
 * estudiante. No expone acciones del ciclo de vida.
 */
export function HistoryCard({ request, detailHref }: HistoryCardProps) {
  const ciclo = estadoCiclo(request);
  const asesoria = request.asesoria;
  const contraparteLabel = request.isOwner ? 'Tutor' : 'Estudiante';
  const contraparte = request.isOwner
    ? (asesoria?.tutor.fullName ?? 'Sin tutor asignado')
    : request.estudiante.fullName;
  const fechaFinalizacion = formatFecha(asesoria?.finalizadaAt ?? null);

  let resumen = '';
  if (asesoria?.estado === 'EVALUADA') {
    resumen = 'Asesoría finalizada y evaluada.';
  } else if (asesoria?.estado === 'FINALIZADA') {
    resumen = `Asesoría finalizada${fechaFinalizacion ? ` el ${fechaFinalizacion}` : ''}.`;
  } else if (asesoria?.estado === 'CANCELADA') {
    resumen = 'Esta asesoría fue cancelada.';
  } else if (request.estado === 'CANCELADA') {
    resumen = 'Esta solicitud fue cancelada antes de asignar un tutor.';
  }

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-poli hover:shadow-lg md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ciclo.className}`}
        >
          {ciclo.label}
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
          <dt className="shrink-0 font-medium text-text-muted">{contraparteLabel}:</dt>
          <dd className="truncate text-text-main">{contraparte}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="shrink-0 font-medium text-text-muted">Disponibilidad:</dt>
          <dd className="truncate text-text-main">{request.disponibilidad}</dd>
        </div>
      </dl>

      {resumen && (
        <p className="flex items-center gap-2 rounded-lg border border-border-color bg-bg-primary p-3 text-sm text-text-muted">
          {asesoria?.finalizadaAt && (
            <CalendarCheck2 className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          )}
          {resumen}
        </p>
      )}

      <div className="mt-auto flex items-center justify-end pt-2">
        <Link
          href={detailHref ?? `/tutoring/requests/${request.id}`}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-poli transition-colors duration-200 hover:bg-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
        >
          Ver detalle
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
