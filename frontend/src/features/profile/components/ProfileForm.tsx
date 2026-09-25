'use client';

import { useEffect, useState } from 'react';
import { HttpError } from '@/lib/httpClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { fetchCarreras, fetchSemestres } from '@/features/auth/api/authApi';
import { validateFullName } from '@/features/auth/hooks/validation';
import { updateMyProfile } from '../api/profileApi';
import type { CatalogItem, UserProfile } from '../types';

interface ProfileFormProps {
  profile: UserProfile;
  onSaved: (profile: UserProfile) => void;
}

type FieldErrors = Record<string, string | undefined>;

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const updateUser = useAuthStore((state) => state.updateUser);

  const [fullName, setFullName] = useState(profile.fullName);
  const [carreraId, setCarreraId] = useState(profile.carrera ? String(profile.carrera.id) : '');
  const [semestreId, setSemestreId] = useState(profile.semestre ? String(profile.semestre.id) : '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [carreras, setCarreras] = useState<CatalogItem[]>([]);
  const [semestres, setSemestres] = useState<CatalogItem[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCarreras(), fetchSemestres()])
      .then(([c, s]) => {
        setCarreras(c);
        setSemestres(s);
      })
      .catch(() => {
        setError('No se pudieron cargar las carreras y semestres. Recarga la pagina.');
      })
      .finally(() => setCatalogsLoading(false));
  }, []);

  function validate(): boolean {
    const errors: FieldErrors = {};

    const nameError = validateFullName(fullName);
    if (nameError) errors.fullName = nameError;

    if (!carreraId) errors.carreraId = 'Selecciona una carrera';
    if (!semestreId) errors.semestreId = 'Selecciona un semestre';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const updated = await updateMyProfile({
        fullName: fullName.trim(),
        carreraId: Number(carreraId),
        semestreId: Number(semestreId),
      });
      updateUser({ fullName: updated.fullName });
      setSuccess(true);
      onSaved(updated);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.errors) {
          const mapped: FieldErrors = {};
          if (err.errors.fullName) mapped.fullName = err.errors.fullName;
          if (err.errors.carreraId) mapped.carreraId = err.errors.carreraId;
          if (err.errors.semestreId) mapped.semestreId = err.errors.semestreId;
          setFieldErrors(mapped);
        }
        setError(err.message);
      } else {
        setError('No pudimos conectar con el servidor. Intenta mas tarde.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (catalogsLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Spinner size="md" />
        <p className="text-sm text-text-muted">Cargando opciones...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && !Object.keys(fieldErrors).length ? <Alert type="error">{error}</Alert> : null}
      {success ? <Alert type="success">Tu perfil se actualizo correctamente.</Alert> : null}

      <div className="flex w-full flex-col gap-1">
        <span className="text-sm font-medium text-text-main">Correo institucional</span>
        <p className="min-h-[44px] rounded-lg border border-border-color bg-bg-primary px-3 py-2 text-base text-text-muted">
          {profile.email}
        </p>
      </div>

      <div className="flex w-full flex-col gap-1">
        <span className="text-sm font-medium text-text-main">Rol</span>
        <p className="text-sm text-text-muted">{profile.role}</p>
      </div>

      <Input
        id="profile-fullname"
        label="Nombre completo"
        type="text"
        placeholder="Tu nombre completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={fieldErrors.fullName}
        autoComplete="name"
      />
      <Select
        id="profile-carrera"
        label="Carrera"
        placeholder="Selecciona tu carrera"
        options={carreras.map((c) => ({ value: c.id, label: c.label }))}
        value={carreraId}
        onChange={(e) => setCarreraId(e.target.value)}
        error={fieldErrors.carreraId}
      />
      <Select
        id="profile-semestre"
        label="Semestre"
        placeholder="Selecciona tu semestre"
        options={semestres.map((s) => ({ value: s.id, label: s.label }))}
        value={semestreId}
        onChange={(e) => setSemestreId(e.target.value)}
        error={fieldErrors.semestreId}
      />

      <Button type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Guardar cambios'}
      </Button>
    </form>
  );
}
