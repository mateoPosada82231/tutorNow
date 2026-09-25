'use client';

import { useState } from 'react';
import { HttpError } from '@/lib/httpClient';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { MateriasSelector } from './MateriasSelector';
import { validateBiografia } from './BecomeTutorModal';
import { updateMyTutorProfile } from '../api/profileApi';
import type { CatalogItem, TutorProfile } from '../types';

interface TutorProfileFormProps {
  tutor: TutorProfile;
  materias: CatalogItem[];
  onSaved: (tutor: TutorProfile) => void;
}

const BIO_MAX = 1000;

export function TutorProfileForm({ tutor, materias, onSaved }: TutorProfileFormProps) {
  const [biografia, setBiografia] = useState(tutor.biografia);
  const [materiaIds, setMateriaIds] = useState<number[]>(tutor.materias.map((m) => m.id));
  const [bioError, setBioError] = useState<string | undefined>();
  const [materiasError, setMateriasError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setSuccess(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const updated = await updateMyTutorProfile({
        biografia: biografia.trim(),
        materiaIds,
      });
      setSuccess(true);
      onSaved(updated);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.errors) {
          if (err.errors.biografia) setBioError(err.errors.biografia);
          if (err.errors.materiaIds) setMateriasError(err.errors.materiaIds);
        }
        setError(err.message);
      } else {
        setError('No pudimos conectar con el servidor. Intenta mas tarde.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error ? <Alert type="error">{error}</Alert> : null}
      {success ? <Alert type="success">Tu perfil de tutor se actualizo correctamente.</Alert> : null}

      <div className="flex w-full flex-col gap-1">
        <label htmlFor="tutor-edit-biografia" className="text-sm font-medium text-text-main">
          Biografia
        </label>
        <textarea
          id="tutor-edit-biografia"
          rows={5}
          maxLength={BIO_MAX}
          value={biografia}
          onChange={(e) => setBiografia(e.target.value)}
          aria-invalid={bioError ? 'true' : 'false'}
          className={`w-full rounded-lg border bg-bg-surface px-3 py-2 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
            bioError ? 'border-error' : 'border-border-color focus:border-brand-poli'
          }`}
        />
        <p className="text-right text-sm text-text-muted">
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
        {loading ? <Spinner size="sm" /> : 'Guardar cambios'}
      </Button>
    </form>
  );
}
