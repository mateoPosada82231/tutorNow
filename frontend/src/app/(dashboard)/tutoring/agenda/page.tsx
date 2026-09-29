'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Pencil, X } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  AvailabilityGrid,
  buildSlotKey,
  fetchMySlots,
  saveMySlots,
  slotKeyFromHoraInicio,
  WEEK_DAYS,
  type TutorSlot,
} from '@/features/schedule';
import { HttpError } from '@/lib/httpClient';

function parseSlotKey(key: string): { diaSemana: string; horaInicio: string } | null {
  const [dia, hora] = key.split('#');
  const diaIndex = WEEK_DAYS.indexOf(dia as (typeof WEEK_DAYS)[number]);
  const horaNum = parseInt(hora, 10);
  if (diaIndex === -1 || Number.isNaN(horaNum)) return null;
  return { diaSemana: dia, horaInicio: `${String(horaNum).padStart(2, '0')}:00` };
}

function sameSlots(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  return Array.from(a).every((key) => b.has(key));
}

export default function TutorAgendaPage() {
  const user = useAuthStore((state) => state.user);
  const isTutor = user?.role === 'TUTOR';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notTutor, setNotTutor] = useState(false);

  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [available, setAvailable] = useState<ReadonlySet<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setNotTutor(false);
    try {
      const slots: TutorSlot[] = await fetchMySlots();
      const keys = new Set(
        slots.map((slot) => slotKeyFromHoraInicio(slot.diaSemana, slot.horaInicio)),
      );
      setSaved(keys);
      setAvailable(new Set(keys));
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        setNotTutor(true);
      } else {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Ocurrio un error inesperado. Intenta de nuevo.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTutor) void loadSlots();
    else setLoading(false);
  }, [isTutor, loadSlots]);

  const handleToggle = (diaSemana: string, hora: number, value: boolean) => {
    setSuccess(null);
    setSaveError(null);
    setAvailable((prev) => {
      const next = new Set(prev);
      const key = buildSlotKey(diaSemana, hora);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSuccess(null);
    try {
      const slots = Array.from(available)
        .map(parseSlotKey)
        .filter((slot): slot is { diaSemana: string; horaInicio: string } => slot !== null)
        .sort((a, b) => {
          const diaDiff =
            WEEK_DAYS.indexOf(a.diaSemana as (typeof WEEK_DAYS)[number]) -
            WEEK_DAYS.indexOf(b.diaSemana as (typeof WEEK_DAYS)[number]);
          return diaDiff !== 0
            ? diaDiff
            : a.horaInicio.localeCompare(b.horaInicio);
        });
      await saveMySlots({ slots });
      setSaved(new Set(available));
      setEditMode(false);
      setSuccess('Tu horario se ha guardado correctamente');
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Ocurrio un error inesperado. Intenta de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAvailable(new Set(saved));
    setEditMode(false);
    setSaveError(null);
    setSuccess(null);
  };

  if (!isTutor || notTutor) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <section className="rounded-2xl border border-border-color bg-gradient-to-br from-bg-surface to-brand-accent/10 p-8 shadow-sm transition-colors duration-300">
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white shadow-md">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-text-main">Aun no eres tutor</h1>
              <p className="mt-2 text-sm text-text-muted">
                La agenda esta disponible para tutores. Si quieres compartir lo que sabes, crea tu
                perfil de tutor desde tu pagina de perfil.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
            >
              Ir a mi perfil
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Alert type="error">{loadError}</Alert>
        <button
          type="button"
          onClick={() => void loadSlots()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const dirty = !sameSlots(saved, available);
  const isEmpty = saved.size === 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] p-6 text-white shadow-lg transition-shadow duration-300 md:p-8">
        <span
          className="absolute -right-12 -top-12 h-40 w-44 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              Disponibilidad semanal
            </span>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Mi agenda</h1>
              <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">
                {editMode
                  ? 'Haz clic en un bloque para marcarlo como disponible. Arrastra sobre varios bloques para marcarlos mas rapido.'
                  : 'Estos son los bloques de horas que los estudiantes pueden reservar para sus asesorias.'}
              </p>
            </div>
          </div>
          {!editMode && (
            <button
              type="button"
              onClick={() => {
                setSuccess(null);
                setEditMode(true);
              }}
              className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Modificar horario
            </button>
          )}
        </div>
      </section>

      {editMode && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <p className="text-sm text-text-muted">
            {dirty
              ? 'Tienes cambios sin guardar.'
              : 'Selecciona o desmarca los bloques que quieras.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border-color bg-transparent px-4 py-2 text-base font-semibold text-text-main transition-colors duration-200 hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || saving}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-poli px-4 py-2 text-base font-semibold text-white transition-colors duration-200 hover:bg-brand-poli-hover focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <span
                  role="status"
                  aria-label="Guardando"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {success && <Alert type="success">{success}</Alert>}
      {saveError && <Alert type="error">{saveError}</Alert>}

      {isEmpty && !editMode ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-bg-surface p-8 text-center transition-colors duration-200">
          <h2 className="text-base font-semibold text-text-main">
            Aun no has configurado tu disponibilidad
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Activa el modo de edicion para marcar los bloques de horas en los que estaras
            disponible para asesorias.
          </p>
        </div>
      ) : (
        <AvailabilityGrid available={available} readOnly={!editMode} onToggle={handleToggle} />
      )}
    </div>
  );
}
