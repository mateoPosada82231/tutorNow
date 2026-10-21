'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, MessageSquareQuote, Star, User } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { AvailabilityGrid, slotKeyFromHoraInicio } from '@/features/schedule';
import {
  acceptProposal,
  fetchTutorProfile,
  fetchTutoringRequest,
  rejectProposal,
} from '@/features/tutoring/api/tutoringApi';
import type { Proposal, TutorProfile, TutoringRequest } from '@/features/tutoring/types';
import { HttpError } from '@/lib/httpClient';

function initialsOf(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function TutorProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <TutorProfileContent />
    </Suspense>
  );
}

function TutorProfileContent() {
  const params = useParams<{ tutorId: string }>();
  const tutorId = Number(params.tutorId);
  const searchParams = useSearchParams();
  const router = useRouter();
  const solicitudIdParam = searchParams.get('solicitud');
  const proposalIdParam = searchParams.get('proposal');

  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [solicitud, setSolicitud] = useState<TutoringRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [deciding, setDeciding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const proposal: Proposal | null =
    solicitud && proposalIdParam
      ? solicitud.propuestas.find((p) => String(p.id) === proposalIdParam) ?? null
      : null;

  const isOwnerStudent = Boolean(solicitud?.isOwner);
  const canDecide =
    isOwnerStudent &&
    solicitud != null &&
    (solicitud.estado === 'PUBLICADA' || solicitud.estado === 'EN_PROCESO') &&
    proposal?.estado === 'PENDIENTE';

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      setProfile(await fetchTutorProfile(tutorId));
      if (solicitudIdParam) {
        setSolicitud(await fetchTutoringRequest(Number(solicitudIdParam)));
      }
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setLoadError('No tienes acceso a esta asesoria.');
      } else {
        setLoadError(
          err instanceof HttpError
            ? err.message
            : 'No pudimos cargar el perfil del tutor. Intenta de nuevo.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [tutorId, solicitudIdParam]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleAccept() {
    if (!proposal) return;
    setDeciding(true);
    setActionError(null);
    try {
      await acceptProposal(proposal.id);
      router.push(`/tutoring/requests/${proposal.solicitudId}`);
    } catch (err) {
      setActionError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos seleccionar al tutor. Intenta de nuevo.',
      );
      setDeciding(false);
    }
  }

  async function handleReject() {
    if (!proposal) return;
    setDeciding(true);
    setActionError(null);
    try {
      await rejectProposal(proposal.id);
      router.push(`/tutoring/requests/${proposal.solicitudId}`);
    } catch (err) {
      setActionError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos rechazar la propuesta. Intenta de nuevo.',
      );
      setDeciding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Alert type="error">{loadError ?? 'No pudimos cargar el perfil del tutor.'}</Alert>
        <button
          type="button"
          onClick={() => void loadProfile()}
          className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link
        href={solicitudIdParam ? `/tutoring/requests/${solicitudIdParam}` : '/tutoring/requests'}
        className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-text-muted transition-colors duration-200 hover:text-brand-poli focus:outline-none focus:ring-2 focus:ring-brand-poli"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </Link>

      <section className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-lg font-bold text-white shadow-md">
            {initialsOf(profile.fullName)}
          </span>
          <div>
            <h1 className="text-xl font-semibold text-text-main md:text-2xl">{profile.fullName}</h1>
            <p className="mt-0.5 text-sm text-text-muted">Tutor</p>
          </div>
        </div>

        {profile.biografia && (
          <p className="mt-4 text-sm text-text-main">{profile.biografia}</p>
        )}

        {profile.materias.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-semibold text-text-main">Materias que asesora</h2>
            <ul aria-label="Materias que asesora" className="mt-2 flex flex-wrap gap-2">
              {profile.materias.map((materia) => (
                <li
                  key={materia.id}
                  className="rounded-full border border-border-color bg-bg-primary px-2.5 py-0.5 text-xs font-medium text-text-main"
                >
                  {materia.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5">
          <h2 className="text-sm font-semibold text-text-main">Disponibilidad</h2>
          {profile.disponibilidad.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">
              Este tutor aun no ha registrado bloques de disponibilidad.
            </p>
          ) : (
            <div className="mt-3">
              <AvailabilityGrid
                compact
                readOnly
                available={
                  new Set(
                    profile.disponibilidad.map((slot) =>
                      slotKeyFromHoraInicio(slot.diaSemana, slot.horaInicio),
                    ),
                  )
                }
              />
            </div>
          )}
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-semibold text-text-main">Reseñas</h2>
          {profile.resenas.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-border-color bg-bg-primary p-4 text-center">
              <MessageSquareQuote className="mx-auto h-5 w-5 text-text-muted" aria-hidden="true" />
              <p className="mt-1 text-sm text-text-muted">
                Este tutor aun no tiene reseñas.
              </p>
            </div>
          ) : (
            <ul className="mt-2 flex flex-col gap-3">
              {profile.resenas.map((resena) => (
                <li
                  key={resena.id}
                  className="rounded-lg border border-border-color bg-bg-primary p-3 text-sm text-text-main"
                >
                  <div className="flex items-center gap-2" aria-label={`Calificacion ${resena.rating}`} >
                    <Star className="h-4 w-4 text-brand-accent" aria-hidden="true" />
                    <span className="text-xs font-semibold">{resena.rating}/5</span>
                    <span className="ml-auto text-xs text-text-muted">{resena.autor}</span>
                  </div>
                  <p className="mt-2">{resena.comentario}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {actionError ? <Alert type="error">{actionError}</Alert> : null}

      {proposal && (
        <section
          aria-label="Seleccionar tutor"
          className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6"
        >
          <h2 className="text-base font-semibold text-text-main">Seleccionar a este tutor</h2>
          <p className="mt-1 text-sm text-text-muted">
            Al aceptar esta la propuesta se cancelaran tosas las demás.
          </p>

          {isOwnerStudent && !canDecide && proposal.estado !== 'PENDIENTE' && (
            <div className="mt-3">
              <Alert type="info">
                Esta propuesta ya fue procesada ({proposal.estado.toLowerCase()}).
              </Alert>
            </div>
          )}

          {proposal.mensaje && (
            <blockquote
              aria-label="Mensaje del tutor"
              className="mt-4 rounded-lg border-l-4 border-brand-accent bg-bg-primary p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Mensaje del tutor
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-text-main">{proposal.mensaje}</p>
            </blockquote>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!canDecide || deciding}
              onClick={() => void handleAccept()}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-success px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-success disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deciding ? <Spinner size="sm" /> : null}
              Aceptar
            </button>
            <button
              type="button"
              disabled={!canDecide || deciding}
              onClick={() => void handleReject()}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-error px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-error disabled:cursor-not-allowed disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </section>
      )}

      {!proposal && (
        <section className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-muted">
              Abre el perfil desde una propuesta recibida para poder aceptar o rechazar al tutor.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
