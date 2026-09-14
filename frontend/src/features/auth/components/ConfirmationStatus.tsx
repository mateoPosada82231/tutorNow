'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HttpError } from '@/lib/httpClient';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

type Status = 'loading' | 'success' | 'error';

interface ConfirmationStatusProps {
  token: string | null;
  action: (token: string) => Promise<unknown>;
  successMessage: string;
  title: string;
}

export function ConfirmationStatus({
  token,
  action,
  successMessage,
  title,
}: ConfirmationStatusProps) {
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState<string>('El enlace no es valido o esta incompleto.');
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;
    action(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setMessage(
          err instanceof HttpError
            ? err.message
            : 'No pudimos procesar tu solicitud. Intenta de nuevo.',
        );
        setStatus('error');
      });
  }, [token, action]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-xl font-semibold text-text-main">{title}</h1>

      {status === 'loading' ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Spinner />
          <p className="text-sm text-text-muted">Validando enlace...</p>
        </div>
      ) : null}

      {status === 'success' ? (
        <>
          <Alert type="success">{successMessage}</Alert>
          <Link href="/login" className="w-full">
            <Button type="button">Ir a iniciar sesion</Button>
          </Link>
        </>
      ) : null}

      {status === 'error' ? (
        <>
          <Alert type="error">{message}</Alert>
          <Link href="/login" className="w-full">
            <Button type="button" variant="ghost">
              Volver a iniciar sesion
            </Button>
          </Link>
        </>
      ) : null}
    </div>
  );
}
