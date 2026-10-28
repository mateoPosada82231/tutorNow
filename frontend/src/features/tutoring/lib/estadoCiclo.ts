import type { TutoringRequest } from '../types';

export interface EstadoCiclo {
  label: string;
  className: string;
}

/**
 * Resume el ciclo de vida visible de una asesoria combinando el estado de la
 * solicitud con el de su asesoria (cuando ya existe).
 */
export function estadoCiclo(request: TutoringRequest): EstadoCiclo {
  if (request.estado === 'CANCELADA' || request.asesoria?.estado === 'CANCELADA') {
    return { label: 'Cancelada', className: 'bg-error/10 text-error' };
  }
  if (request.estado === 'PUBLICADA') {
    return { label: 'Publicada', className: 'bg-brand-poli/10 text-brand-poli' };
  }
  if (request.estado === 'EN_PROCESO') {
    return { label: 'Con propuestas', className: 'bg-brand-accent/20 text-text-main' };
  }
  if (request.asesoria?.estado === 'EVALUADA') {
    return { label: 'Evaluada', className: 'bg-brand-poli/10 text-brand-poli' };
  }
  if (request.asesoria?.estado === 'FINALIZADA') {
    return { label: 'Finalizada', className: 'bg-success/10 text-success' };
  }
  return { label: 'En coordinación', className: 'bg-success/10 text-success' };
}
