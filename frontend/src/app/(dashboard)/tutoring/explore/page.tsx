'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { fetchTutoringRequests } from '@/features/tutoring/api/tutoringApi';
import { fetchCatalogoMaterias } from '@/features/tutoring/api/tutoringApi';
import type { TutoringRequest, TutoringRequestFilters, CatalogItem } from '@/features/tutoring/types';
import { RequestCard } from '@/features/tutoring/components/RequestCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function ExplorePage() {
  const [requests, setRequests] = useState<TutoringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materias, setMaterias] = useState<CatalogItem[]>([]);
  const [filters, setFilters] = useState<TutoringRequestFilters>({
    vista: 'abiertas',
    page: 0,
    size: 10,
  });

  useEffect(() => {
    fetchCatalogoMaterias().then(setMaterias).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchTutoringRequests(filters);
        if (mounted) {
          setRequests(data.data);
        }
      } catch {
        if (mounted) setError('No se pudieron cargar las solicitudes');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [filters]);

  const handleFilterChange = (key: keyof TutoringRequestFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
  };

  const clearFilters = () => {
    setFilters({ vista: 'abiertas', page: 0, size: 10 });
  };

  const hasActiveFilters = filters.materiaId || filters.modalidad || filters.q;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Explorar asesorías</h1>
          <p className="text-sm text-text-muted">Solicitudes de estudiantes buscando tutor</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-3 border border-border-color bg-bg-surface rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <Input
              id="explore-search"
              label="Buscar"
              placeholder="Buscar por tema, materia..."
              value={filters.q ?? ''}
              onChange={(e) => handleFilterChange('q', e.target.value || undefined)}
              className="min-h-[44px]"
            />
          </div>
          <div className="w-full sm:w-56 sm:shrink-0">
            <Select
              id="explore-materia"
              label="Materia"
              placeholder="Todas las materias"
              options={materias.map((m) => ({ value: m.id, label: m.label }))}
              value={filters.materiaId ?? ''}
              onChange={(e) => handleFilterChange('materiaId', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="w-full sm:w-40 sm:shrink-0">
            <Select
              id="explore-modalidad"
              label="Modalidad"
              placeholder="Modalidad"
              options={[
                { value: 'VIRTUAL', label: 'Virtual' },
                { value: 'PRESENCIAL', label: 'Presencial' },
              ]}
              value={filters.modalidad ?? ''}
              onChange={(e) => handleFilterChange('modalidad', e.target.value || undefined)}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 min-h-[44px] self-end px-4 py-2 text-sm font-medium text-text-muted hover:text-brand-poli transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin border-2 border-brand-poli border-t-transparent rounded-full" aria-hidden="true" />
          <p className="text-text-muted">Cargando solicitudes...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <p className="text-error">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Filter className="h-12 w-12 text-text-muted" aria-hidden="true" />
          <p className="text-text-main">No hay solicitudes con esos filtros</p>
          <p className="text-sm text-text-muted">Intenta ampliar tu búsqueda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}