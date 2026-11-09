type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
}

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'border-border-color bg-bg-primary text-text-muted',
  success: 'border-success bg-success/10 text-success',
  warning: 'border-error bg-error/10 text-error',
  danger: 'bg-error text-white',
  info: 'border-brand-poli bg-brand-poli/10 text-brand-poli',
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_STYLES[tone]}`}
    >
      {label}
    </span>
  );
}

export const TONE_BY_ROL: Record<string, Tone> = {
  ADMIN: 'danger',
  TUTOR: 'info',
  ESTUDIANTE: 'neutral',
};

export const TONE_BY_ESTADO_MODERACION: Record<string, Tone> = {
  VISIBLE: 'success',
  RETIRADA: 'danger',
};

export const LABEL_ESTADO_SOLICITUD: Record<string, string> = {
  PUBLICADA: 'Publicada',
  EN_PROCESO: 'En proceso',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

export const LABEL_ESTADO_MODERACION: Record<string, string> = {
  VISIBLE: 'Visible',
  RETIRADA: 'Retirada',
};

export const LABEL_ESTADO_REPORTE: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  RESUELTO: 'Resuelto',
  DESCARTADO: 'Descartado',
};

export const LABEL_TIPO_REPORTE: Record<string, string> = {
  PUBLICACION: 'Publicacion',
  RESENA: 'Reseña',
  USUARIO: 'Usuario',
};

export const TONE_BY_ESTADO_REPORTE: Record<string, Tone> = {
  PENDIENTE: 'warning',
  RESUELTO: 'success',
  DESCARTADO: 'neutral',
};

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
