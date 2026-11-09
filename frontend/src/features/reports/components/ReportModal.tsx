'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Flag, X } from 'lucide-react';
import { HttpError } from '@/lib/httpClient';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { createReport } from '../api/reportsApi';
import type { ReportTargetType } from '../types';

export const MOTIVO_MIN = 3;
export const MOTIVO_MAX = 120;
export const DESCRIPCION_MIN = 5;
export const DESCRIPCION_MAX = 1000;

const TIPO_LABEL: Record<ReportTargetType, string> = {
  PUBLICACION: 'la publicación',
  RESENA: 'la reseña',
  USUARIO: 'al usuario',
};

const validMotivo = 'Contenido inapropiado | Informacion falsa | Spam | Otro';

export function validateMotivo(motivo: string): string | null {
  if (motivo.trim().length < MOTIVO_MIN) return 'El motivo es obligatorio';
  if (motivo.trim().length > MOTIVO_MAX) return `El motivo no puede superar ${MOTIVO_MAX} caracteres`;
  return null;
}

export function validateDescripcion(descripcion: string): string | null {
  const trimmed = descripcion.trim();
  if (trimmed.length > 0 && trimmed.length < DESCRIPCION_MIN) {
    return `La descripcion debe tener al menos ${DESCRIPCION_MIN} caracteres`;
  }
  if (trimmed.length > DESCRIPCION_MAX) {
    return `La descripcion no puede superar ${DESCRIPCION_MAX} caracteres`;
  }
  return null;
}

export interface ReportModalProps {
  tipo: ReportTargetType;
  targetId: number;
  open: boolean;
  onClose: () => void;
}

export function ReportModal({ tipo, targetId, open, onClose }: ReportModalProps) {
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [motivoError, setMotivoError] = useState<string | undefined>();
  const [descripcionError, setDescripcionError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onEscape);
      return () => document.removeEventListener('keydown', onEscape);
    }
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setMotivo('');
      setDescripcion('');
      setMotivoError(undefined);
      setDescripcionError(undefined);
      setError(null);
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const motivoValidation = validateMotivo(motivo);
    const descripcionValidation = validateDescripcion(descripcion);
    setMotivoError(motivoValidation ?? undefined);
    setDescripcionError(descripcionValidation ?? undefined);
    if (motivoValidation || descripcionValidation) return;

    setLoading(true);
    try {
      await createReport({
        tipo,
        targetId,
        motivo: motivo.trim(),
        descripcion: descripcion.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.errors?.motivo) setMotivoError(err.errors.motivo);
        if (err.errors?.descripcion) setDescripcionError(err.errors.descripcion);
        setError(err.message);
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('No pudimos conectar con el servidor. Intenta mas tarde.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-border-color bg-bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 id="report-modal-title" className="flex items-center gap-2 text-lg font-semibold text-text-main">
            <AlertTriangle className="h-5 w-5 text-error" aria-hidden="true" />
            Reportar {TIPO_LABEL[tipo]}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-colors duration-200 hover:bg-brand-poli/10 hover:text-brand-poli"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col gap-4">
            <Alert type="success">
              Gracias por tu reporte. El equipo de moderacion lo revisara cuanto antes.
            </Alert>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error ? <Alert type="error">{error}</Alert> : null}

            <div className="flex w-full flex-col gap-1">
              <label htmlFor="report-motivo" className="text-sm font-medium text-text-main">
                Motivo
              </label>
              <input
                id="report-motivo"
                type="text"
                list="report-motivo-sugerencias"
                maxLength={MOTIVO_MAX}
                placeholder="Razon del reporte"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                aria-invalid={motivoError ? 'true' : 'false'}
                className={`w-full rounded-lg border bg-bg-surface px-3 py-2 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                  motivoError ? 'border-error' : 'border-border-color focus:border-brand-poli'
                }`}
              />
              <datalist id="report-motivo-sugerencias">
                {validMotivo.split(' | ').map((sugerencia) => (
                  <option key={sugerencia} value={sugerencia} />
                ))}
              </datalist>
              {motivoError ? (
                <p role="alert" className="text-sm text-error">
                  {motivoError}
                </p>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-1">
              <label htmlFor="report-descripcion" className="text-sm font-medium text-text-main">
                Descripcion (opcional)
              </label>
              <textarea
                id="report-descripcion"
                rows={4}
                maxLength={DESCRIPCION_MAX}
                placeholder="Cuentanos que ocurre para agilizar la revision"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                aria-invalid={descripcionError ? 'true' : 'false'}
                aria-describedby="report-descripcion-count"
                className={`w-full rounded-lg border bg-bg-surface px-3 py-2 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                  descripcionError ? 'border-error' : 'border-border-color focus:border-brand-poli'
                }`}
              />
              <p id="report-descripcion-count" className="text-right text-sm text-text-muted">
                {descripcion.trim().length}/{DESCRIPCION_MAX}
              </p>
              {descripcionError ? (
                <p role="alert" className="text-sm text-error">
                  {descripcionError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Spinner size="sm" /> : (
                  <>
                    <Flag className="h-4 w-4" aria-hidden="true" />
                    Enviar reporte
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-border-color px-4 text-sm font-semibold text-text-muted transition-colors duration-200 hover:bg-bg-primary"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
