'use client';

import { useCallback, useEffect, useState } from 'react';
import { HttpError } from '@/lib/httpClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { BecomeTutorModal } from '@/features/profile/components/BecomeTutorModal';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { TutorProfileForm } from '@/features/profile/components/TutorProfileForm';
import {
  fetchMaterias,
  fetchMyProfile,
  fetchMyTutorProfile,
} from '@/features/profile/api/profileApi';
import type { CatalogItem, TutorProfile, UserProfile } from '@/features/profile/types';

export default function ProfilePage() {
  const updateUser = useAuthStore((state) => state.updateUser);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [materias, setMaterias] = useState<CatalogItem[]>([]);
  const [isTutor, setIsTutor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, materiasData] = await Promise.all([fetchMyProfile(), fetchMaterias()]);
      setProfile(profileData);
      setMaterias(materiasData);
      setIsTutor(profileData.isTutor);
      if (profileData.isTutor) {
        try {
          const tutorData = await fetchMyTutorProfile();
          setTutor(tutorData);
        } catch (err) {
          if (!(err instanceof HttpError && err.status === 404)) throw err;
        }
      }
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('No pudimos conectar con el servidor. Intenta mas tarde.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleTutorSuccess(newTutor: TutorProfile) {
    setTutor(newTutor);
    setIsTutor(true);
    setModalOpen(false);
    updateUser({ role: 'TUTOR' });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Alert type="error">{error ?? 'No se pudo cargar tu perfil.'}</Alert>
        <Button type="button" variant="secondary" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="rounded-2xl border border-border-color bg-bg-surface p-6 shadow-sm transition-colors duration-300">
        <h1 className="mb-4 text-xl font-semibold text-text-main">Mi perfil</h1>
        <ProfileForm profile={profile} onSaved={setProfile} />
      </section>

      {isTutor && tutor ? (
        <section className="rounded-2xl border border-border-color bg-bg-surface p-6 shadow-sm transition-colors duration-300">
          <h2 className="mb-4 text-lg font-semibold text-text-main">Perfil de tutor</h2>
          <TutorProfileForm tutor={tutor} materias={materias} onSaved={setTutor} />
        </section>
      ) : (
        <section className="rounded-2xl border border-border-color bg-gradient-to-br from-bg-surface to-brand-accent/10 p-6 shadow-sm transition-colors duration-300">
          <h2 className="mb-2 text-lg font-semibold text-text-main">Quieres ser tutor?</h2>
          <p className="mb-4 text-sm text-text-muted">
            Comparte tu conocimiento con otros estudiantes del Politecnico. Crea tu perfil de tutor
            indicando las materias que dominas y aparece en el catalogo de tutores.
          </p>
          <Button type="button" className="w-auto" onClick={() => setModalOpen(true)}>
            Quiero ser tutor
          </Button>
        </section>
      )}

      <BecomeTutorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTutorSuccess}
        materias={materias}
      />
    </div>
  );
}
