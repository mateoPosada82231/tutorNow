'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HttpError } from '@/lib/httpClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { resetPassword } from '../api/authApi';
import { validatePassword } from '../hooks/validation';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof HttpError
          ? err.message
          : 'No pudimos restablecer tu contrasena. Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-xl font-semibold text-text-main">Contrasena actualizada</h1>
        <Alert type="success">Tu contrasena fue restablecida. Ya puedes iniciar sesion.</Alert>
        <Link href="/login">
          <Button type="button">Ir a iniciar sesion</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h1 className="text-xl font-semibold text-text-main">Restablecer contrasena</h1>

      {error ? <Alert type="error">{error}</Alert> : null}

      <PasswordInput
        id="reset-password"
        label="Nueva contrasena"
        placeholder="Minimo 8 caracteres, mayuscula, minuscula y numero"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        showRequirements
      />
      <PasswordInput
        id="reset-confirm"
        label="Confirmar nueva contrasena"
        placeholder="Repite la contrasena"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
      />

      <Button type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Restablecer contrasena'}
      </Button>
    </form>
  );
}
