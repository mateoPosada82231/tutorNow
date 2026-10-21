'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, MessageCircle, Trash2, User } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ProposalCard } from '@/features/tutoring/components/ProposalCard';
import {
  acceptProposal,
  cancelTutoringRequest,
  createProposal,
  fetchTutoringRequest,
  rejectProposal,
} from '@/features/tutoring/api/tutoringApi';
import type { Proposal, SolicitudEstado, TutoringRequest } from '@/features/tutoring/types';
import { validateMensaje } from '@/features/tutoring/hooks/validation';
import { useAuthStore } from '@/stores/useAuthStore';
import { HttpError } from '@/lib/httpClient';

const estadoStyles: Record<SolicitudEstado, string> = {
  PUBLICADA: 'bg-brand-poli/10 text-brand-poli',
  EN_PROCESO: 'bg-brand-accent/20 text-text-main',
  CONFIRMADA: 'bg-success/10 text-success',
  CANCELADA: 'bg-error/10 text-error',
};

const estadoLabels: Record<SolicitudEstado, string> = {
  PUBLICADA: 'Publicada',
  EN_PROCESO: 'En proceso',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const modalidadLabels: Record<TutoringRequest['modalidad'], string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
};

export default function TutoringRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = Number(params.id);
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';

  const [request, setRequest] = useState<TutoringRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalConflict, setProposalConflict] = useState(false);
  const [sendingProposal, setSendingProposal] = useState(false);

  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [chatNotice, setChatNotice] = useState(false);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setAccessDenied(false);
    try {
      setRequest(await fetchTutoringRequest(requestId));
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setAccessDenied(true);
        setLoadError('No tienes acceso a esta asesoria.');
      } else {
        setLoadError(
          err instanceof HttpError
            ? err.message
            : 'No pudimos cargar la asesoria. Intenta de nuevo.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  async function handleSendProposal(e: React.FormEvent) {
    e.preventDefault();
    setProposalError(null);
    setProposalConflict(false);

    const mensajeError = validateMensaje(proposalMessage);
    if (mensajeError) {
      setProposalError(mensajeError);
      return;
    }

    setSendingProposal(true);
    try {
      await createProposal(requestId, { mensaje: proposalMessage.trim() });
      setProposalMessage('');
      await loadRequest();
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        setProposalConflict(true);
      } else if (err instanceof HttpError) {
        setProposalError(err.message);
      } else {
        setProposalError('No pudimos enviar tu propuesta. Intenta de nuevo.');
      }
    } finally {
      setSendingProposal(false);
    }
  }

  async function handleAccept(proposalId: number) {
    setDecidingId(proposalId);
    setActionError(null);
    try {
      await acceptProposal(proposalId);
      await loadRequest();
    } catch (err) {
      setActionError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos aceptar la propuesta. Intenta de nuevo.',
      );
    } finally {
      setDecidingId(null);
    }
  }

  async function handleReject(proposalId: number) {
    setDecidingId(proposalId);
    setActionError(null);
    try {
      await rejectProposal(proposalId);
      await loadRequest();
    } catch (err) {
      setActionError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos rechazar la propuesta. Intenta de nuevo.',
      );
    } finally {
      setDecidingId(null);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      'Seguro que quieres cancelar esta asesoria? Esta accion no se puede deshacer.',
    );
    if (!confirmed) return;

    setCancelling(true);
    setActionError(null);
    try {
      await cancelTutoringRequest(requestId);
      await loadRequest();
    } catch (err) {
      setActionError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos cancelar la asesoria. Intenta de nuevo.',
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (loadError || !request) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Alert type="error">{loadError ?? 'No pudimos cargar la asesoria.'}</Alert>
        {accessDenied ? (
          <Link
            href="/tutoring/requests"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a asesorias
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void loadRequest()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const isOwner = request.isOwner;
  const acceptsProposals =
    isOwner && (request.estado === 'PUBLICADA' || request.estado === 'EN_PROCESO');
  const canPropose =
    isTutor &&
    !isOwner &&
    (request.estado === 'PUBLICADA' || request.estado === 'EN_PROCESO');
  const myProposal = request.propuestas.find((proposal) => proposal.isMine) ?? null;
  const acceptedProposal = request.propuestas.find(
    (proposal): proposal is Proposal => proposal.estado === 'ACEPTADA',
  );
  const canCancel =
    isOwner && (request.estado === 'PUBLICADA' || request.estado === 'EN_PROCESO');
  const chatEnabled = request.estado === 'CONFIRMADA';

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/tutoring/requests"
        className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-text-muted transition-colors duration-200 hover:text-brand-poli focus:outline-none focus:ring-2 focus:ring-brand-poli"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a asesorias
      </Link>

      <section className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoStyles[request.estado]}`}
          >
            {estadoLabels[request.estado]}
          </span>
          <span className="inline-flex items-center rounded-full border border-border-color bg-bg-primary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
            {modalidadLabels[request.modalidad]}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-semibold text-text-main md:text-2xl">{request.tema}</h1>
        <p className="mt-1 text-sm text-text-muted">{request.materia.label}</p>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2">
            <dt className="flex shrink-0 items-center gap-1.5 font-medium text-text-muted">
              <User className="h-4 w-4" aria-hidden="true" />
              Estudiante
            </dt>
            <dd className="text-text-main">{request.estudiante.fullName}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="flex shrink-0 items-center gap-1.5 font-medium text-text-muted">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Disponibilidad
            </dt>
            <dd className="text-text-main">{request.disponibilidad}</dd>
          </div>
          {request.descripcion && (
            <div className="flex flex-col gap-1">
              <dt className="font-medium text-text-muted">Descripcion</dt>
              <dd className="whitespace-pre-line text-text-main">{request.descripcion}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-col gap-3 border-t border-border-color pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={!chatEnabled}
            onClick={() => setChatNotice(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Entrar al chat
            {chatEnabled && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                Proximamente
              </span>
            )}
          </button>

          {canCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => void handleCancel()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-error bg-transparent px-4 py-2 text-base font-semibold text-error transition-colors duration-200 hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelling ? (
                <Spinner size="sm" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Cancelar asesoria
            </button>
          )}
        </div>

        {chatNotice && chatEnabled && (
          <div className="mt-4">
            <Alert type="info">El chat estara disponible proximamente</Alert>
          </div>
        )}
      </section>

      {actionError ? <Alert type="error">{actionError}</Alert> : null}

      {request.estado === 'CONFIRMADA' && acceptedProposal && (
        <section aria-label="Propuesta aceptada" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-text-main">Propuesta aceptada</h2>
            {request.asesoria && (
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-accent/20 px-3 py-0.5 text-xs font-semibold text-text-main">
                Asesoria #{request.asesoria.id} · Pendiente
              </span>
            )}
          </div>
          <div className="transition-colors duration-200">
            <ProposalCard proposal={acceptedProposal} canDecide={false} />
          </div>
        </section>
      )}

      {acceptsProposals && (
        <section aria-label="Propuestas recibidas" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-main">
            Propuestas recibidas ({request.propuestas.length})
          </h2>
          {request.propuestas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-color bg-bg-surface p-8 text-center transition-colors duration-200">
              <h3 className="text-base font-semibold text-text-main">
                Aun no hay propuestas para esta asesoria
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                En cuanto un tutor este interesado, veras su propuesta aqui.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {request.propuestas.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  canDecide={proposal.estado === 'PENDIENTE'}
                  onAccept={(id) => void handleAccept(id)}
                  onReject={(id) => void handleReject(id)}
                  deciding={decidingId === proposal.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {canPropose && !myProposal && (
        <section
          aria-label="Enviar propuesta"
          className="rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-300 md:p-6"
        >
          <h2 className="text-lg font-semibold text-text-main">Envia tu propuesta</h2>
          <p className="mt-1 text-sm text-text-muted">
            Explicale al estudiante por que puedes ayudarle con este tema.
          </p>
          <form onSubmit={(e) => void handleSendProposal(e)} className="mt-4 flex flex-col gap-4" noValidate>
            {proposalConflict ? (
              <Alert type="info">Ya enviaste una propuesta a esta asesoria</Alert>
            ) : null}
            <Textarea
              id="mensaje"
              label="Mensaje"
              minLength={10}
              maxLength={500}
              rows={4}
              placeholder="Cuentale al estudiante como puedes ayudarle, tu experiencia y disponibilidad..."
              value={proposalMessage}
              onChange={(e) => {
                setProposalMessage(e.target.value);
                setProposalError(null);
              }}
              error={proposalError ?? undefined}
            />
            <p className="self-end text-xs text-text-muted" aria-live="polite">
              {proposalMessage.length}/500
            </p>
            <Button type="submit" disabled={sendingProposal}>
              {sendingProposal ? <Spinner size="sm" /> : 'Enviar propuesta'}
            </Button>
          </form>
        </section>
      )}

      {canPropose && myProposal && (
        <section aria-label="Mi propuesta" className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-text-main">Tu propuesta</h2>
          <ProposalCard proposal={myProposal} canDecide={false} />
        </section>
      )}
    </div>
  );
}
