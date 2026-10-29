'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, X, Check, AlertCircle } from 'lucide-react';
import type { ChatResumen } from '../types';

interface ChatThreadCardProps {
  thread: ChatResumen;
  onClick?: () => void;
}

export function ChatThreadCard({ thread, onClick }: ChatThreadCardProps) {
  const fecha = thread.ultimoMensajeAt
    ? formatDistanceToNow(new Date(thread.ultimoMensajeAt), { addSuffix: true, locale: es })
    : '';

  const estadoLabels: Record<string, { label: string; className: string }> = {
    PENDIENTE: { label: 'En curso', className: 'bg-brand-poli/10 text-brand-poli' },
    FINALIZADA: { label: 'Finalizada', className: 'bg-green-500/10 text-green-500' },
    EVALUADA: { label: 'Evaluada', className: 'bg-blue-500/10 text-blue-500' },
    CANCELADA: { label: 'Cancelada', className: 'bg-error/10 text-error' },
  };

  const estado = estadoLabels[thread.estado] ?? { label: thread.estado, className: 'bg-gray-500/10 text-gray-500' };

  return (
    <Link
      href={`/tutoring/chats/${thread.asesoriaId}`}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex gap-3 p-4 rounded-xl border border-border-color bg-bg-surface transition-colors duration-200 hover:border-brand-poli/50 hover:bg-brand-poli/5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-poli/10">
        <MessageSquare className="h-6 w-6 text-brand-poli" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-text-main">
              {thread.contraparte.fullName}
            </h3>
            <p className="truncate text-sm text-text-muted">
              {thread.materia} — {thread.tema}
            </p>
          </div>
          {thread.noLeidos > 0 && (
            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-poli px-1.5 text-xs font-bold text-white">
              {thread.noLeidos > 99 ? '99+' : thread.noLeidos}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estado.className}`}>
            {estado.label}
          </span>
          {!thread.permiteEscritura && thread.estado !== 'CANCELADA' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-text-muted bg-bg-muted">
              <Check className="h-3 w-3" aria-hidden="true" />
              Solo lectura
            </span>
          )}
          {thread.estado === 'CANCELADA' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-error bg-error/10">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              Cancelada
            </span>
          )}
        </div>

        {thread.ultimoMensaje && (
          <p className="mt-2 truncate text-sm text-text-muted">{thread.ultimoMensaje}</p>
        )}

        {fecha && (
          <p className="mt-1 text-xs text-text-muted">{fecha}</p>
        )}
      </div>
    </Link>
  );
}