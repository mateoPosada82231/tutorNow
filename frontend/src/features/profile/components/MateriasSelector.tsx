'use client';

import { useMemo, useState } from 'react';
import type { CatalogItem } from '../types';

interface MateriasSelectorProps {
  options: CatalogItem[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  disabled?: boolean;
}

export function MateriasSelector({
  options,
  selectedIds,
  onChange,
  error,
  disabled = false,
}: MateriasSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = useMemo(
    () => options.filter((o) => selectedIds.includes(o.id)),
    [options, selectedIds],
  );

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor="materias-search" className="text-sm font-medium text-text-main">
        Materias
      </label>
      <input
        id="materias-search"
        type="search"
        placeholder="Buscar materia..."
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        className={`min-h-[44px] w-full rounded-lg border bg-bg-surface px-3 py-2 text-base text-text-main transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-poli ${
          error ? 'border-error' : 'border-border-color focus:border-brand-poli'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label="Buscar materia"
      />
      <div
        role="group"
        aria-label="Listado de materias"
        aria-invalid={error ? 'true' : 'false'}
        className={`max-h-48 overflow-y-auto rounded-lg border bg-bg-surface transition-colors duration-200 ${
          error ? 'border-error' : 'border-border-color'
        }`}
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-sm text-text-muted">No hay materias que coincidan</p>
        ) : (
          <ul>
            {filtered.map((opt) => {
              const checked = selectedIds.includes(opt.id);
              return (
                <li key={opt.id}>
                  <label
                    className={`flex min-h-[44px] w-full cursor-pointer items-center gap-3 px-3 py-2 transition-colors duration-200 hover:bg-brand-poli/5 ${
                      disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(opt.id)}
                      className="h-5 w-5 shrink-0 accent-brand-poli"
                    />
                    <span className="text-base text-text-main">{opt.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Materias seleccionadas">
          {selected.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded-full bg-brand-poli/10 px-3 py-1 text-sm text-brand-poli"
            >
              {opt.label}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-text-muted">
        {selected.length} materia{selected.length === 1 ? '' : 's'} seleccionada
        {selected.length === 1 ? '' : 's'}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
