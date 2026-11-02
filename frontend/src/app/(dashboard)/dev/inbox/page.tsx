'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, Loader2, RefreshCw } from 'lucide-react';
import { httpClient } from '@/lib/httpClient';

export interface CorreoSimulado {
  to: string;
  subject: string;
  content: string;
  link: string;
  kind: 'verification' | 'password_reset' | 'password_change_confirmation' | 'new_message';
  createdAt: string;
}

type CorreoKind = CorreoSimulado['kind'];

const kindLabels: Record<CorreoKind, string> = {
  verification: 'Verificación de correo',
  password_reset: 'Recuperar contraseña',
  password_change_confirmation: 'Cambio de contraseña',
  new_message: 'Nuevo mensaje',
};

const kindChipClasses: Record<CorreoKind, string> = {
  verification: 'bg-brand-poli/10 text-brand-poli',
  password_reset: 'bg-error/10 text-error',
  password_change_confirmation: 'bg-success/10 text-success',
  new_message: 'bg-brand-accent/20 text-text-main',
};

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return dateFormatter.format(fecha);
}

export default function DevInboxPage() {
  const [correos, setCorreos] = useState<CorreoSimulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await httpClient.get<CorreoSimulado[]>('/dev/inbox', { auth: true });
      setCorreos(data);
    } catch {
      setError('No se pudieron cargar los correos simulados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-poli" aria-label="Cargando Bandeja de entrada" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-error">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-poli px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-poli-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-poli"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-main md:text-3xl">Bandeja de entrada</h1>
        <p className="max-w-2xl text-sm text-text-muted md:text-base">
          Aqui ves los correos de demostracion que envia el sistema: este envio es simulado y no
          llega a ninguna direccion real.
        </p>
      </header>

      {correos.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-color bg-bg-surface p-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-poli/10 text-brand-poli">
            <Inbox className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-text-main">Tu bandeja esta vacia</h2>
          <p className="max-w-md text-sm text-text-muted">
            Aun no se ha enviado ningun correo simulado. Los veras aqui cuando el sistema los genere.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {correos.map((correo, idx) => {
            const isChatLink = correo.link.includes('/tutoring/chats');
            return (
              <li
                key={`${correo.createdAt}-${idx}`}
                className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-all duration-200 hover:border-brand-poli hover:shadow-lg md:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${kindChipClasses[correo.kind]}`}
                  >
                    {kindLabels[correo.kind]}
                  </span>
                  <time className="text-xs text-text-muted">{formatFecha(correo.createdAt)}</time>
                </div>
                <div>
                  <p className="text-sm text-text-muted">
                    Para: <span className="font-medium text-text-main">{correo.to}</span>
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-text-main">{correo.subject}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">{correo.content}</p>
                </div>
                <div>
                  {isChatLink ? (
                    <Link
                      href="/tutoring/chats"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-poli px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-poli-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-poli"
                    >
                      Abrir conversación
                    </Link>
                  ) : (
                    <a
                      href={correo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-poli px-4 py-2.5 text-sm font-semibold text-brand-poli transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-poli/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-poli"
                    >
                      Ver correo
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

