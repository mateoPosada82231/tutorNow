'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { HttpError } from '@/lib/httpClient';
import { createTutoringRequest, fetchCatalogoMaterias, fetchMisResenas } from '../api/tutoringApi';
import {
  hasFieldErrors,
  validateTutoringRequest,
  type TutoringRequestFieldErrors,
} from '../hooks/validation';
import type { CatalogItem, Modalidad, ResenaPendiente } from '../types';

const modalidadOptions = [
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'PRESENCIAL', label: 'Presencial' },
];

export function PublishRequestForm() {
  const router = useRouter();

  const [materias, setMaterias] = useState<CatalogItem[]>([]);
  const [materiasLoading, setMateriasLoading] = useState(true);
  const [materiasError, setMateriasError] = useState<string | null>(null);

  const [pendientes, setPendientes] = useState<ResenaPendiente[]>([]);
  const [pendientesLoading, setPendientesLoading] = useState(true);

  const [materiaId, setMateriaId] = useState<number>(0);
  const [tema, setTema] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad | ''>('');
  const [disponibilidad, setDisponibilidad] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [fieldErrors, setFieldErrors] = useState<TutoringRequestFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadMaterias() {
    setMateriasLoading(true);
    setMateriasError(null);
    try {
      setMaterias(await fetchCatalogoMaterias());
    } catch {
      setMateriasError('No pudimos cargar las asignaturas. Intenta de nuevo.');
    } finally {
      setMateriasLoading(false);
    }
  }

  async function loadPendientes() {
    setPendientesLoading(true);
    try {
      const resumen = await fetchMisResenas();
      setPendientes(resumen.pendientes);
    } catch {
      // El backend sigue bloqueando la publicacion aunque esta consulta falle.
      setPendientes([]);
    } finally {
      setPendientesLoading(false);
    }
  }

  useEffect(() => {
    void loadMaterias();
    void loadPendientes();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (pendientes.length > 0) {
      setFormError('Debes calificar tus asesorías finalizadas antes de publicar una nueva solicitud.');
      return;
    }

    const data = {
      materiaId,
      tema,
      modalidad: modalidad as Modalidad,
      disponibilidad,
      descripcion: descripcion.trim() ? descripcion.trim() : undefined,
    };

    const errors = validateTutoringRequest(data);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setSubmitting(true);
    try {
      await createTutoringRequest(data);
      router.push('/tutoring/requests');
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        setFormError(err.message);
        await loadPendientes();
      } else if (err instanceof HttpError && err.errors) {
        const mapped: TutoringRequestFieldErrors = {};
        if (err.errors.materiaId) mapped.materiaId = err.errors.materiaId;
        if (err.errors.tema) mapped.tema = err.errors.tema;
        if (err.errors.modalidad) mapped.modalidad = err.errors.modalidad;
        if (err.errors.disponibilidad) mapped.disponibilidad = err.errors.disponibilidad;
        if (err.errors.descripcion) mapped.descripcion = err.errors.descripcion;
        if (hasFieldErrors(mapped)) {
          setFieldErrors(mapped);
        } else {
          setFormError(err.message);
        }
      } else if (err instanceof HttpError) {
        setFormError(err.message);
      } else {
        setFormError('No pudimos conectar con el servidor. Intenta mas tarde.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError ? <Alert type="error">{formError}</Alert> : null}

      {pendientes.length > 0 ? (
        <Alert type="error">
          <p>Debes calificar tus asesorías finalizadas antes de publicar una nueva solicitud.</p>
          <ul className="mt-2 list-disc pl-5">
            {pendientes.map((pendiente) => (
              <li key={pendiente.asesoriaId}>
                <Link
                  href={`/tutoring/requests/${pendiente.solicitudId}`}
                  className="font-semibold underline focus:outline-none focus:ring-2 focus:ring-brand-poli"
                >
                  {pendiente.tema}
                </Link>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {materiasLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-border-color bg-bg-surface px-3 py-2 text-sm text-text-muted">
          <Spinner size="sm" />
          Cargando asignaturas...
        </div>
      ) : materiasError ? (
        <div className="flex flex-col gap-2">
          <Alert type="error">{materiasError}</Alert>
          <Button type="button" variant="secondary" onClick={() => void loadMaterias()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <Select
          id="materiaId"
          label="Asignatura"
          placeholder="Selecciona una asignatura"
          options={materias.map((materia) => ({ value: materia.id, label: materia.label }))}
          value={materiaId || ''}
          onChange={(e) => {
            setMateriaId(Number(e.target.value));
            setFieldErrors((prev) => ({ ...prev, materiaId: undefined }));
          }}
          error={fieldErrors.materiaId}
        />
      )}

      <Input
        id="tema"
        label="Tema"
        type="text"
        minLength={5}
        maxLength={120}
        placeholder="Ecuaciones diferenciales, integrales, termodinamica..."
        value={tema}
        onChange={(e) => {
          setTema(e.target.value);
          setFieldErrors((prev) => ({ ...prev, tema: undefined }));
        }}
        error={fieldErrors.tema}
      />

      <Select
        id="modalidad"
        label="Modalidad"
        placeholder="Selecciona una modalidad"
        options={modalidadOptions}
        value={modalidad}
        onChange={(e) => {
          setModalidad(e.target.value as Modalidad | '');
          setFieldErrors((prev) => ({ ...prev, modalidad: undefined }));
        }}
        error={fieldErrors.modalidad}
      />

      <div className="flex flex-col gap-1">
        <Textarea
          id="disponibilidad"
          label="Disponibilidad"
          minLength={5}
          maxLength={300}
          rows={3}
          placeholder="Cuentale a los tutores tu disponibilidad horaria"
          value={disponibilidad}
          onChange={(e) => {
            setDisponibilidad(e.target.value);
            setFieldErrors((prev) => ({ ...prev, disponibilidad: undefined }));
          }}
          error={fieldErrors.disponibilidad}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Textarea
          id="descripcion"
          label="Descripcion adicional (opcional)"
          maxLength={1000}
          rows={4}
          placeholder="Cuentale a los tutores que necesitas saber sobre el tema"
          value={descripcion}
          onChange={(e) => {
            setDescripcion(e.target.value);
            setFieldErrors((prev) => ({ ...prev, descripcion: undefined }));
          }}
          error={fieldErrors.descripcion}
        />
        <p className="self-end text-xs text-text-muted" aria-live="polite">
          {descripcion.length}/1000
        </p>
      </div>

      <Button type="submit" disabled={submitting || materiasLoading || pendientesLoading || pendientes.length > 0}>
        {submitting ? <Spinner size="sm" /> : 'Publicar asesoria'}
      </Button>
    </form>
  );
}
