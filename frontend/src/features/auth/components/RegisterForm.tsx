'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HttpError } from '@/lib/httpClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { registerUser } from '../api/authApi';
import { validateInstitutionalEmail, validatePassword } from '../hooks/validation';

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [program, setProgram] = useState('');
  const [semester, setSemester] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};

    const emailError = validateInstitutionalEmail(email);
    if (emailError) errors.email = emailError;

    if (!fullName.trim()) errors.fullName = 'El nombre completo es obligatorio';

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (confirmPassword !== password) errors.confirmPassword = 'Las contrasenas no coinciden';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await registerUser({
        email,
        password,
        fullName: fullName.trim(),
        program: program.trim() || undefined,
        semester: semester ? Number(semester) : undefined,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.errors) {
          const mapped: FieldErrors = {};
          if (err.errors.email) mapped.email = err.errors.email;
          if (err.errors.password) mapped.password = err.errors.password;
          if (err.errors.fullName) mapped.fullName = err.errors.fullName;
          setFieldErrors(mapped);
        }
        setError(err.message);
      } else {
        setError('No pudimos conectar con el servidor. Intenta mas tarde.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-xl font-semibold text-text-main">Registro exitoso</h1>
        <Alert type="success">
          Revisa tu correo institucional <strong>@elpoli.edu.co</strong> y sigue el enlace para
          confirmar tu cuenta antes de iniciar sesion.
        </Alert>
        <Link href="/login">
          <Button type="button">Ir a iniciar sesion</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h1 className="text-xl font-semibold text-text-main">Crear cuenta</h1>

      {error && !Object.keys(fieldErrors).length ? <Alert type="error">{error}</Alert> : null}

      <Input
        id="reg-email"
        label="Correo institucional"
        type="email"
        placeholder="nombre@elpoli.edu.co"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        autoComplete="email"
      />
      <Input
        id="reg-fullname"
        label="Nombre completo"
        type="text"
        placeholder="Tu nombre completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={fieldErrors.fullName}
        autoComplete="name"
      />
      <Input
        id="reg-program"
        label="Programa (opcional)"
        type="text"
        placeholder="Ej. Ingenieria de Sistemas"
        value={program}
        onChange={(e) => setProgram(e.target.value)}
      />
      <Input
        id="reg-semester"
        label="Semestre (opcional)"
        type="number"
        min={1}
        max={12}
        placeholder="Ej. 5"
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
      />
      <Input
        id="reg-password"
        label="Contrasena"
        type="password"
        placeholder="Minimo 8 caracteres, mayuscula, minuscula y numero"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        autoComplete="new-password"
      />
      <Input
        id="reg-confirm"
        label="Confirmar contrasena"
        type="password"
        placeholder="Repite tu contrasena"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
        autoComplete="new-password"
      />

      <Button type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Registrarme'}
      </Button>

      <p className="text-center text-sm text-text-muted">
        Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-brand-poli underline-offset-4 transition-colors duration-200 hover:underline"
        >
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
