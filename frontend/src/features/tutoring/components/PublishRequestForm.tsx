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
import {
  createTutoringRequest,
  fetchCatalogoMaterias,
  fetchMisResenas,
  fetchTutores,
} from '../api/tutoringApi';
import {
  hasFieldErrors,
  validateTutoringRequest,
  type TutoringRequestFieldErrors,
} from '../hooks/validation';
import type { CatalogItem, Modalidad, ResenaPendiente, TutorSummary } from '../types';

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

  const [audienciaAbierta, setAudienciaAbierta] = useState(false);
  const [tutores, setTutores] = useState<TutorSummary[]>([]);
  const [tutoresLoading, setTutoresLoading] = useState(false);
  const [tutoresError, setTutoresError] = useState<string | null>(null);
  const [tutorIdsSeleccionados, setTutorIdsSeleccionados] = useState<number[]>([]);

  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

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

  async function loadTutores() {
    setTutoresLoading(true);
    setTutoresError(null);
    try {
      setTutores(await fetchTutores());
    } catch {
      setTutoresError('No pudimos cargar los tutores. Intenta de nuevo.');
    } finally {
      setTutoresLoading(false);
    }
  }

  function toggleAudiencia() {
    const abrir = !audienciaAbierta;
    setAudienciaAbierta(abrir);
    if (abrir && tutores.length === 0 && !tutoresLoading) {
      void loadTutores();
    }
  }

  function toggleTutor(tutorId: number) {
    setTutorIdsSeleccionados((prev) =>
      prev.includes(tutorId) ? prev.filter((id) => id !== tutorId) : [...prev, tutorId],
    );
  }

  useEffect(() => {
    void loadMaterias();
    void loadPendientes();
  }, []);

  function handleSubmit(e: React.FormEvent) {
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
      tutorIds: [...tutorIdsSeleccionados],
    };

    const errors = validateTutoringRequest(data);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    setConfirmacionAbierta(true);
  }

  async function publicar() {
    const data = {
      materiaId,
      tema,
      modalidad: modalidad as Modalidad,
      disponibilidad,
      descripcion: descripcion.trim() ? descripcion.trim() : undefined,
      tutorIds: [...tutorIdsSeleccionados],
    };

    setFormError(null);
    setSubmitting(true);
    try {
      await createTutoringRequest(data);
      router.push('/tutoring/requests');
    } catch (err) {
      setConfirmacionAbierta(false);
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

      <div className="rounded-lg border border-border-color bg-bg-surface p-3">
        <button
          type="button"
          onClick={toggleAudiencia}
          aria-expanded={audienciaAbierta}
          className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-text-main focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-poli"
        >
          <span>Elegir tutores que podran ver tu asesoria (opcional)</span>
          <span aria-hidden="true" className="text-text-muted">
            {audienciaAbierta ? '−' : '+'}
          </span>
        </button>

        {audienciaAbierta ? (
          <div role="group" aria-label="Tutores que podran ver tu asesoria" className="mt-3">
            <p className="text-xs text-text-muted">
              Si no seleccionas a nadie, todos los tutores podran ver tu publicacion.
            </p>

            {tutoresLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                <Spinner size="sm" />
                Cargando tutores...
              </div>
            ) : tutoresError ? (
              <div className="mt-2 flex flex-col gap-2">
                <Alert type="error">{tutoresError}</Alert>
                <Button type="button" variant="secondary" onClick={() => void loadTutores()}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <>
                <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border-color bg-bg-primary">
                  {tutores.map((tutor) => (
                    <li key={tutor.id} className="border-b border-border-color last:border-b-0">
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-bg-surface">
                        <input
                          type="checkbox"
                          checked={tutorIdsSeleccionados.includes(tutor.id)}
                          onChange={() => toggleTutor(tutor.id)}
                          className="h-4 w-4 accent-brand-poli"
                        />
                        <span className="font-medium text-text-main">{tutor.nombre}</span>
                        <span className="truncate text-xs text-text-muted">
                          {tutor.materias.map((materia) => materia.label).join(', ')}
                        </span>
                      </label>
                    </li>
                  ))}
                  {tutores.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-text-muted">
                      No hay tutores disponibles aun.
                    </li>
                  ) : null}
                </ul>
                <p className="mt-2 text-xs text-text-muted" aria-live="polite">
                  {tutorIdsSeleccionados.length} de {tutores.length} tutores seleccionados
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={submitting || materiasLoading || pendientesLoading || pendientes.length > 0}>
        {submitting ? <Spinner size="sm" /> : 'Publicar asesoria'}
      </Button>

      {confirmacionAbierta ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-publicacion-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border-color bg-bg-surface p-6 shadow-lg">
            <div>
              <h2
                id="confirm-publicacion-title"
                className="text-lg font-semibold text-text-main"
              >
                Confirma los detalles de tu asesoria
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Revisa que todo este correcto antes de publicarla.
              </p>
            </div>

            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-text-muted">Asignatura</dt>
                <dd className="text-right text-text-main">
                  {materias.find((materia) => materia.id === materiaId)?.label}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-text-muted">Tema</dt>
                <dd className="text-right text-text-main">{tema.trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-text-muted">Modalidad</dt>
                <dd className="text-right text-text-main">
                  {modalidadOptions.find((opcion) => opcion.value === modalidad)?.label}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-text-muted">Disponibilidad</dt>
                <dd className="text-right text-text-main">{disponibilidad.trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-text-muted">Descripcion</dt>
                <dd className="text-right text-text-main">
                  {descripcion.trim() || 'Sin descripcion adicional'}
                </dd>
              </div>
            </dl>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmacionAbierta(false)}
                disabled={submitting}
              >
                Seguir editando
              </Button>
              <Button type="button" onClick={() => void publicar()} disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Confirmar y publicar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
