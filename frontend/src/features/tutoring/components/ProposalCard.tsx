import Link from 'next/link';
import type { Proposal } from '../types';

const estadoStyles: Record<Proposal['estado'], string> = {
  PENDIENTE: 'bg-brand-accent/20 text-text-main',
  ACEPTADA: 'bg-success/10 text-success',
  RECHAZADA: 'bg-error/10 text-error',
};

const estadoLabels: Record<Proposal['estado'], string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
};

function initialsOf(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface ProposalCardProps {
  proposal: Proposal;
  canDecide: boolean;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  deciding?: boolean;
}

export function ProposalCard({ proposal, canDecide, onAccept, onReject, deciding }: ProposalCardProps) {
  const showActions = canDecide && proposal.estado === 'PENDIENTE';

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-200 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-sm font-bold text-white shadow-md">
            {initialsOf(proposal.tutor.fullName)}
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-text-main">
              {proposal.tutor.fullName}
              {proposal.isMine && (
                <span className="rounded-full bg-brand-poli/10 px-2 py-0.5 text-xs font-semibold text-brand-poli">
                  Mi propuesta
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">Tutor</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoStyles[proposal.estado]}`}
        >
          {estadoLabels[proposal.estado]}
        </span>
      </div>

      {proposal.tutor.biografia && (
        <p className="text-sm text-text-muted">{proposal.tutor.biografia}</p>
      )}

      {proposal.tutor.materias.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Materias del tutor">
          {proposal.tutor.materias.map((materia) => (
            <li
              key={materia.id}
              className="rounded-full border border-border-color bg-bg-primary px-2.5 py-0.5 text-xs font-medium text-text-main"
            >
              {materia.label}
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-lg bg-bg-primary p-3 text-sm text-text-main">{proposal.mensaje}</p>

      {showActions && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {!proposal.isMine && (
            <Link
              href={`/tutoring/tutors/${proposal.tutor.id}?solicitud=${proposal.solicitudId}&proposal=${proposal.id}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-brand-poli bg-transparent px-4 py-2 text-base font-semibold text-brand-poli transition-colors duration-200 hover:bg-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
            >
              Ver perfil
            </Link>
          )}
          <button
            type="button"
            onClick={() => onAccept?.(proposal.id)}
            disabled={deciding}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-success px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success disabled:cursor-not-allowed disabled:opacity-50"
          >
            Aceptar
          </button>
          <button
            type="button"
            onClick={() => onReject?.(proposal.id)}
            disabled={deciding}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-error px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-error disabled:cursor-not-allowed disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}

      {!showActions && !proposal.isMine && (
        <Link
          href={`/tutoring/tutors/${proposal.tutor.id}`}
          className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-lg border border-border-color bg-transparent px-4 py-2 text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-brand-poli focus:outline-none focus:ring-2 focus:ring-brand-poli"
        >
          Ver perfil
        </Link>
      )}
    </article>
  );
}
