'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { forgotPassword } from '../api/authApi';
import { validateInstitutionalEmail } from '../hooks/validation';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateInstitutionalEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('No pudimos procesar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-xl font-semibold text-text-main">Revisa tu correo</h1>
        <Alert type="success">
          Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena. Expira
          en 15 minutos.
        </Alert>
        <Link href="/login">
          <Button type="button" variant="ghost">
            Volver a iniciar sesion
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h1 className="text-xl font-semibold text-text-main">Recuperar contrasena</h1>
      <p className="text-sm text-text-muted">
        Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contrasena.
      </p>

      {error ? <Alert type="error">{error}</Alert> : null}

      <Input
        id="forgot-email"
        label="Correo institucional"
        type="email"
        placeholder="nombre@elpoli.edu.co"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <Button type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Enviar enlace'}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm text-brand-poli underline-offset-4 transition-colors duration-200 hover:underline"
      >
        Volver a iniciar sesion
      </Link>
    </form>
  );
}
