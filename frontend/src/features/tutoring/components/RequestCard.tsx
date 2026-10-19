import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { SolicitudEstado, TutoringRequest } from '../types';

const estadoStyles: Record<SolicitudEstado, string> = {
  PUBLICADA: 'bg-brand-poli/10 text-brand-poli',
  EN_PROCESO: 'bg-brand-accent/20 text-text-main',
  CONFIRMADA: 'bg-success/10 text-success',
  CANCELADA: 'bg-error/10 text-error',
};

const estadoLabels: Record<SolicitudEstado, string> = {
  PUBLICADA: 'Publicada',
  EN_PROCESO: 'En proceso',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const modalidadLabels: Record<TutoringRequest['modalidad'], string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
};

interface RequestCardProps {
  request: TutoringRequest;
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <article className="group flex h-full flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-poli hover:shadow-lg md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoStyles[request.estado]}`}
        >
          {estadoLabels[request.estado]}
        </span>
        <span className="inline-flex items-center rounded-full border border-border-color bg-bg-primary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
          {modalidadLabels[request.modalidad]}
        </span>
        {request.isProfileMatch === true && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Ajusta a tu perfil
          </span>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-main">{request.tema}</h3>
        <p className="mt-1 text-sm text-text-muted">{request.materia.label}</p>
      </div>

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2">
          <dt className="shrink-0 font-medium text-text-muted">Disponibilidad:</dt>
          <dd className="truncate text-text-main">{request.disponibilidad}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="shrink-0 font-medium text-text-muted">Publicada por:</dt>
          <dd className="truncate text-text-main">{request.estudiante.fullName}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-sm text-text-muted">
          {request.propuestasCount === 1
            ? '1 propuesta'
            : `${request.propuestasCount} propuestas`}
        </span>
        <Link
          href={`/tutoring/requests/${request.id}`}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-poli transition-colors duration-200 hover:bg-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
        >
          Ver detalle
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
