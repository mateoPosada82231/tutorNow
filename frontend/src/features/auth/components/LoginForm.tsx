'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HttpError } from '@/lib/httpClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { loginUser } from '../api/authApi';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotVerified(false);
    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      setAuth(response.accessToken, {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 403) {
          setNotVerified(true);
        } else if (err.status === 401) {
          setError('Correo o contrasena incorrectos');
        } else {
          setError(err.message);
        }
      } else {
        setError('No pudimos conectar con el servidor. Intenta mas tarde.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h1 className="text-xl font-semibold text-text-main">Iniciar sesion</h1>

      {error ? <Alert type="error">{error}</Alert> : null}
      {notVerified ? (
        <Alert type="info">
          Debes confirmar tu correo institucional antes de iniciar sesion. Revisa tu bandeja de
          entrada y sigue el enlace de verificacion.
        </Alert>
      ) : null}

      <Input
        id="email"
        label="Correo institucional"
        type="email"
        placeholder="nombre@elpoli.edu.co"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        id="password"
        label="Contrasena"
        type="password"
        placeholder="Tu contrasena"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <Button type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Ingresar'}
      </Button>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-brand-poli underline-offset-4 transition-colors duration-200 hover:underline"
        >
          Olvide mi contrasena
        </Link>
        <p className="text-text-muted">
          No tienes cuenta?{' '}
          <Link
            href="/register"
            className="font-medium text-brand-poli underline-offset-4 transition-colors duration-200 hover:underline"
          >
            Registrate
          </Link>
        </p>
      </div>
    </form>
  );
}
