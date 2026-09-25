'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { HttpError } from '@/lib/httpClient';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { MateriasSelector } from './MateriasSelector';
import { becomeTutor } from '../api/profileApi';
import type { CatalogItem, TutorProfile } from '../types';

interface BecomeTutorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (tutor: TutorProfile) => void;
  materias: CatalogItem[];
}

const BIO_MIN = 10;
const BIO_MAX = 1000;

export function validateBiografia(bio: string): string | null {
  const trimmed = bio.trim();
  if (!trimmed) return 'Cuentanos por que quieres ser tutor';
  if (trimmed.length < BIO_MIN) return `La biografia debe tener al menos ${BIO_MIN} caracteres`;
  if (trimmed.length > BIO_MAX) return `La biografia no puede superar ${BIO_MAX} caracteres`;
  return null;
}

export function BecomeTutorModal({ open, onClose, onSuccess, materias }: BecomeTutorModalProps) {
  const [biografia, setBiografia] = useState('');
  const [materiaIds, setMateriaIds] = useState<number[]>([]);
  const [bioError, setBioError] = useState<string | undefined>();
  const [materiasError, setMateriasError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function validate(): boolean {
    const bio = validateBiografia(biografia);
    setBioError(bio ?? undefined);
    if (materiaIds.length === 0) {
      setMateriasError('Selecciona al menos una materia');
    } else {
      setMateriasError(undefined);
    }
    return !bio && materiaIds.length > 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const tutor = await becomeTutor({ biografia: biografia.trim(), materiaIds });
      onSuccess(tutor);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 409) {
          setError('Ya tienes un perfil de tutor activo.');
        } else if (err.errors) {
          if (err.errors.biografia) setBioError(err.errors.biografia);
          if (err.errors.materiaIds) setMateriasError(err.errors.materiaIds);
          setError(err.message);
        } else {
          setError(err.message);
        }
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
      aria-labelledby="become-tutor-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-border-color bg-bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 id="become-tutor-title" className="text-lg font-semibold text-text-main">
            Convertirme en tutor
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {error ? <Alert type="error">{error}</Alert> : null}

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="tutor-biografia" className="text-sm font-medium text-text-main">
              Biografia
            </label>
            <textarea
              id="tutor-biografia"
              rows={5}
              maxLength={BIO_MAX}
              placeholder="Cuenta a otros estudiantes que puedes ayudarles a aprender..."
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              aria-invalid={bioError ? 'true' : 'false'}
              aria-describedby="tutor-biografia-count"
              className={`w-full rounded-lg border bg-bg-surface px-3 py-2 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
                bioError ? 'border-error' : 'border-border-color focus:border-brand-poli'
              }`}
            />
            <p id="tutor-biografia-count" className="text-right text-sm text-text-muted">
              {biografia.trim().length}/{BIO_MAX}
            </p>
            {bioError ? (
              <p role="alert" className="text-sm text-error">
                {bioError}
              </p>
            ) : null}
          </div>

          <MateriasSelector
            options={materias}
            selectedIds={materiaIds}
            onChange={(ids) => {
              setMateriaIds(ids);
              if (ids.length > 0) setMateriasError(undefined);
            }}
            error={materiasError}
            disabled={loading}
          />

          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Convertirme en tutor'}
          </Button>
        </form>
      </div>
    </div>
  );
}
