'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { HttpError } from '@/lib/httpClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { registerUser, fetchCarreras, fetchSemestres } from '../api/authApi';
import {
  validateInstitutionalEmail,
  validatePassword,
  validateFullName,
} from '../hooks/validation';
import type { CatalogItem } from '../types';

type FieldErrors = Record<string, string | undefined>;

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [semestreId, setSemestreId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [carreras, setCarreras] = useState<CatalogItem[]>([]);
  const [semestres, setSemestres] = useState<CatalogItem[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCarreras(), fetchSemestres()])
      .then(([c, s]) => {
        setCarreras(c);
        setSemestres(s);
      })
      .catch(() => {
        setError('No se pudieron cargar las carreras y semestres. Recarga la pagina.');
      })
      .finally(() => setCatalogsLoading(false));
  }, []);

  function validateField(name: string, value: string): string | undefined {
    switch (name) {
      case 'email':
        return validateInstitutionalEmail(value) ?? undefined;
      case 'fullName':
        return validateFullName(value) ?? undefined;
      case 'password':
        return validatePassword(value) ?? undefined;
      case 'confirmPassword':
        return value !== password ? 'Las contrasenas no coinciden' : undefined;
      default:
        return undefined;
    }
  }

  const handleBlur = useCallback(
    (name: string, value: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const err = validateField(name, value);
      setFieldErrors((prev) => {
        if (err) return { ...prev, [name]: err };
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    },
    [password],
  );

  const handleChange = useCallback(
    (name: string, value: string, setter: (v: string) => void) => {
      setter(value);
      if (touched[name]) {
        const err = validateField(name, value);
        setFieldErrors((prev) => {
          if (err) return { ...prev, [name]: err };
          const { [name]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [touched, password],
  );

  function validate(): boolean {
    const errors: FieldErrors = {};

    const emailError = validateInstitutionalEmail(email);
    if (emailError) errors.email = emailError;

    const nameError = validateFullName(fullName);
    if (nameError) errors.fullName = nameError;

    if (!carreraId) errors.carreraId = 'Selecciona una carrera';
    if (!semestreId) errors.semestreId = 'Selecciona un semestre';

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (confirmPassword !== password) errors.confirmPassword = 'Las contrasenas no coinciden';

    setFieldErrors(errors);
    setTouched({
      email: true,
      fullName: true,
      carreraId: true,
      semestreId: true,
      password: true,
      confirmPassword: true,
    });
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
        carreraId: Number(carreraId),
        semestreId: Number(semestreId),
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.errors) {
          const mapped: FieldErrors = {};
          if (err.errors.email) mapped.email = err.errors.email;
          if (err.errors.password) mapped.password = err.errors.password;
          if (err.errors.fullName) mapped.fullName = err.errors.fullName;
          if (err.errors.carreraId) mapped.carreraId = err.errors.carreraId;
          if (err.errors.semestreId) mapped.semestreId = err.errors.semestreId;
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

  if (catalogsLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Spinner size="md" />
        <p className="text-sm text-text-muted">Cargando opciones...</p>
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
        onChange={(e) => handleChange('email', e.target.value, setEmail)}
        onBlur={(e) => handleBlur('email', e.target.value)}
        error={fieldErrors.email}
        valid={touched.email && !fieldErrors.email && email.length > 0}
        autoComplete="email"
      />
      <Input
        id="reg-fullname"
        label="Nombre completo"
        type="text"
        placeholder="Tu nombre completo"
        value={fullName}
        onChange={(e) => handleChange('fullName', e.target.value, setFullName)}
        onBlur={(e) => handleBlur('fullName', e.target.value)}
        error={fieldErrors.fullName}
        valid={touched.fullName && !fieldErrors.fullName && fullName.length > 0}
        autoComplete="name"
      />
      <Select
        id="reg-carrera"
        label="Carrera"
        placeholder="Selecciona tu carrera"
        options={carreras.map((c) => ({ value: c.id, label: c.label }))}
        value={carreraId}
        onChange={(e) => setCarreraId(e.target.value)}
        error={fieldErrors.carreraId}
      />
      <Select
        id="reg-semester"
        label="Semestre"
        placeholder="Selecciona tu semestre"
        options={semestres.map((s) => ({ value: s.id, label: s.label }))}
        value={semestreId}
        onChange={(e) => setSemestreId(e.target.value)}
        error={fieldErrors.semestreId}
      />
      <PasswordInput
        id="reg-password"
        label="Contrasena"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={(e) => handleBlur('password', e.target.value)}
        error={fieldErrors.password}
        valid={touched.password && !fieldErrors.password && password.length > 0}
        placeholder="Minimo 8 caracteres, mayuscula, minuscula y numero"
        autoComplete="new-password"
        showRequirements
      />
      <PasswordInput
        id="reg-confirm"
        label="Confirmar contrasena"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
        error={fieldErrors.confirmPassword}
        valid={touched.confirmPassword && !fieldErrors.confirmPassword && confirmPassword.length > 0}
        placeholder="Repite tu contrasena"
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
