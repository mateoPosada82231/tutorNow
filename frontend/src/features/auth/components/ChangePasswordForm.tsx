'use client';

import { useState } from 'react';
import { HttpError } from '@/lib/httpClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { changePassword } from '../api/authApi';
import { validatePassword } from '../hooks/validation';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
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
      await changePassword(currentPassword, newPassword);
      setSent(true);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          setError('La contrasena actual es incorrecta');
        } else {
          setError(err.message);
        }
      } else {
        setError('No pudimos procesar el cambio. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Alert type="success">
        Solicitud recibida. Revisa tu correo institucional y confirma el cambio con el enlace.
        Expira en 15 minutos.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error ? <Alert type="error">{error}</Alert> : null}

      <Input
        id="current-password"
        label="Contrasena actual"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
      />
      <PasswordInput
        id="new-password"
        label="Nueva contrasena"
        placeholder="Minimo 8 caracteres, mayuscula, minuscula y numero"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        showRequirements
      />
      <PasswordInput
        id="confirm-new-password"
        label="Confirmar nueva contrasena"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
      />

      <Button type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Solicitar cambio'}
      </Button>
    </form>
  );
}
