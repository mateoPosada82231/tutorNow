'use client';

import { useEffect, useMemo, useRef } from 'react';

export const WEEK_DAYS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

export const HOUR_SLOTS = Array.from({ length: 10 }, (_, i) => 8 + i);

const DAY_LABELS: Record<string, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

export function buildSlotKey(diaSemana: string, hora: number): string {
  return `${diaSemana}#${hora}`;
}

export function slotKeyFromHoraInicio(diaSemana: string, horaInicio: string): string {
  const hora = parseInt(horaInicio.slice(0, 2), 10);
  return buildSlotKey(diaSemana, hora);
}

export function formatHour(hora: number): string {
  return `${String(hora).padStart(2, '0')}:00`;
}

function getWeekDates(): Date[] {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

interface AvailabilityGridProps {
  available: ReadonlySet<string>;
  readOnly?: boolean;
  compact?: boolean;
  onToggle?: (diaSemana: string, hora: number, value: boolean) => void;
}

export function AvailabilityGrid({
  available,
  readOnly = false,
  compact = false,
  onToggle,
}: AvailabilityGridProps) {
  const draggingRef = useRef(false);
  const dragValueRef = useRef(false);

  const weekDates = useMemo(() => getWeekDates(), []);

  useEffect(() => {
    const stopDrag = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, []);

  const handlePointerDown = (diaSemana: string, hora: number) => {
    if (readOnly || !onToggle) return;
    const value = !available.has(buildSlotKey(diaSemana, hora));
    draggingRef.current = true;
    dragValueRef.current = value;
    onToggle(diaSemana, hora, value);
  };

  const handlePointerEnter = (diaSemana: string, hora: number) => {
    if (readOnly || !onToggle || !draggingRef.current) return;
    onToggle(diaSemana, hora, dragValueRef.current);
  };

  const cellBase = `w-full rounded-md border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-poli ${
    compact ? 'h-8' : 'h-11'
  }`;

  const cellState = (isAvailable: boolean) => {
    if (isAvailable) {
      return 'border-brand-poli bg-brand-poli';
    }
    if (readOnly) {
      return 'border-border-color bg-border-color';
    }
    return 'border-border-color bg-border-color hover:border-brand-poli hover:bg-brand-poli/20 cursor-pointer';
  };

  return (
    <div
      className={`select-none rounded-2xl border border-border-color bg-bg-surface shadow-sm transition-colors duration-200 ${
        compact ? 'p-3 md:p-4' : 'p-4 md:p-6'
      }`}
    >
      <div className="overflow-x-auto">
        <div className={compact ? 'min-w-[24rem]' : 'min-w-[42rem]'}>
          <div
            className={`grid gap-1.5 ${
              compact
                ? 'grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-1'
                : 'grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]'
            }`}
            role="grid"
            aria-label="Cuadricula de disponibilidad semanal"
          >
            <div aria-hidden="true" />
            {WEEK_DAYS.map((dia) => (
              <div
                key={dia}
                className={`flex flex-col items-center justify-center pb-2 text-center ${
                  compact ? '' : 'gap-0.5'
                }`}
              >
                <span
                  className={`font-semibold uppercase tracking-wide text-text-main ${
                    compact ? 'text-[10px]' : 'text-xs'
                  }`}
                >
                  {DAY_LABELS[dia]}
                </span>
                {!compact && (
                  <span className="text-xs text-text-muted" suppressHydrationWarning>
                    {weekDates[WEEK_DAYS.indexOf(dia)]
                      ? dateFormatter.format(weekDates[WEEK_DAYS.indexOf(dia)])
                      : ''}
                  </span>
                )}
              </div>
            ))}

            {HOUR_SLOTS.map((hora) => (
              <div key={hora} className="col-span-8 grid grid-cols-subgrid">
                <div
                  className={`flex items-center justify-end pr-2 font-medium text-text-muted ${
                    compact ? 'text-[10px]' : 'text-xs'
                  }`}
                >
                  {formatHour(hora)}
                </div>
                {WEEK_DAYS.map((dia) => {
                  const key = buildSlotKey(dia, hora);
                  const isAvailable = available.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      aria-pressed={isAvailable}
                      aria-label={`${DAY_LABELS[dia]} ${formatHour(hora)} ${isAvailable ? 'disponible' : 'no disponible'}`}
                      className={`${cellBase} ${cellState(isAvailable)}`}
                      onPointerDown={() => handlePointerDown(dia, hora)}
                      onPointerEnter={() => handlePointerEnter(dia, hora)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-5 text-xs text-text-muted">
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-sm border border-brand-poli bg-brand-poli" aria-hidden="true" />
          Disponible
        </span>
        <span className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-sm border border-border-color bg-border-color"
            aria-hidden="true"
          />
          No disponible
        </span>
      </div>
    </div>
  );
}
