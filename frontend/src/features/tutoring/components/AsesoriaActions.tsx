'use client';

import { useState } from 'react';
import { CheckCircle2, Clock3, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { HttpError } from '@/lib/httpClient';
import { cancelTutoringRequest, finishAsesoria } from '../api/tutoringApi';
import type { TutoringRequest } from '../types';

interface AsesoriaActionsProps {
  request: TutoringRequest;
  onUpdated?: () => void | Promise<void>;
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
 * Acciones del ciclo de vida de la asesoria (finalizar/cancelar) y resumen de
 * las confirmaciones de ambas partes. Se reutiliza en la agenda y en el detalle.
 */
export function AsesoriaActions({ request, onUpdated }: AsesoriaActionsProps) {
  const [pendingAction, setPendingAction] = useState<'finish' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const asesoria = request.asesoria;
  if (!asesoria) return null;

  if (asesoria.estado === 'CANCELADA') {
    return (
      <p className="rounded-lg border border-border-color bg-bg-primary p-3 text-sm text-text-muted">
        Esta asesoría fue cancelada.
      </p>
    );
  }

  if (asesoria.estado === 'FINALIZADA' || asesoria.estado === 'EVALUADA') {
    const fecha = formatFecha(asesoria.finalizadaAt);
    return (
      <p className="flex items-center gap-2 rounded-lg border border-border-color bg-bg-primary p-3 text-sm text-text-muted">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
        {asesoria.estado === 'EVALUADA'
          ? 'Asesoría finalizada y evaluada.'
          : `Asesoría finalizada${fecha ? ` el ${fecha}` : ''}.`}
      </p>
    );
  }

  const miConfirmacion = request.isOwner
    ? asesoria.confirmadaEstudiante
    : asesoria.confirmadaTutor;
  const otraConfirmacion = request.isOwner
    ? asesoria.confirmadaTutor
    : asesoria.confirmadaEstudiante;
  const otraParte = request.isOwner ? 'El tutor' : 'El estudiante';

  async function handleFinish() {
    setPendingAction('finish');
    setError(null);
    try {
      await finishAsesoria(asesoria!.id);
      await onUpdated?.();
    } catch (err) {
      setError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos confirmar la finalización. Intenta de nuevo.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      'Seguro que quieres cancelar esta asesoría? Esta acción no se puede deshacer.',
    );
    if (!confirmed) return;

    setPendingAction('cancel');
    setError(null);
    try {
      await cancelTutoringRequest(request.id);
      await onUpdated?.();
    } catch (err) {
      setError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos cancelar la asesoría. Intenta de nuevo.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-color bg-bg-primary p-3">
      <div>
        <h3 className="text-sm font-semibold text-text-main">Finalización</h3>
        <p className="mt-1 text-xs text-text-muted">
          Ambas partes deben confirmar que la asesoría se realizó.
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-center gap-2 text-text-main">
          {miConfirmacion ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <Clock3 className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          )}
          {miConfirmacion ? 'Confirmaste la finalización' : 'Falta tu confirmación'}
        </li>
        <li className="flex items-center gap-2 text-text-main">
          {otraConfirmacion ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <Clock3 className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          )}
          {otraConfirmacion
            ? `${otraParte} confirmó la finalización`
            : `${otraParte} aún no confirma`}
        </li>
      </ul>

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={miConfirmacion || pendingAction !== null}
          onClick={() => void handleFinish()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-poli px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingAction === 'finish' ? (
            <Spinner size="sm" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          {miConfirmacion ? 'Esperando a la otra parte' : 'Confirmar finalización'}
        </button>
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={() => void handleCancel()}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error transition-all duration-200 hover:bg-error/10 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md active:translate-y-0 active:shadow-none focus:outline-none focus:ring-2 focus:ring-error disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
        >
          {pendingAction === 'cancel' ? (
            <Spinner size="sm" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
          Cancelar asesoría
        </button>
      </div>
    </div>
  );
}
