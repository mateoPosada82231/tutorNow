'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderX, RefreshCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { listAdminPublications, withdrawPublication } from '@/features/admin/api/adminApi';
import {
  LABEL_ESTADO_MODERACION,
  LABEL_ESTADO_SOLICITUD,
  PaginationControls,
  StatusBadge,
  TONE_BY_ESTADO_MODERACION,
  formatFecha,
} from '@/features/admin/components';
import type { AdminPublication, PageResponse } from '@/features/admin/types';

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PUBLICADA', label: 'Abiertas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

const MODERACION_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'VISIBLE', label: 'Visibles' },
  { value: 'RETIRADA', label: 'Retiradas' },
];

export default function AdminPublicationsPage() {
  const [page, setPage] = useState(0);
  const [estado, setEstado] = useState('');
  const [moderacion, setModeracion] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ estado: '', moderacion: '', q: '' });
  const [q, setQ] = useState('');
  const [result, setResult] = useState<PageResponse<AdminPublication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      setResult(
        await listAdminPublications({
          estado: appliedFilters.estado || undefined,
          moderacion: appliedFilters.moderacion || undefined,
          q: appliedFilters.q || undefined,
          page,
          size: 10,
        }),
      );
    } catch {
      setActionError('No pudimos cargar las publicaciones. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleWithdraw(publication: AdminPublication) {
    setActionError(null);
    setWithdrawing(publication.id);
    try {
      await withdrawPublication(publication.id);
      await load();
    } catch (err) {
      setActionError(
        err instanceof Error && err.message ? err.message : 'No pudimos retirar la publicacion.',
      );
    } finally {
      setWithdrawing(null);
    }
  }

  function submitFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setAppliedFilters({ estado, moderacion, q: q.trim() });
  }

  return (
    <section aria-label="Moderacion de publicaciones" className="flex flex-col gap-4">
      <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          id="admin-pubs-q"
          label="Buscar"
          type="search"
          placeholder="Tema o materia"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          id="admin-pubs-estado"
          label="Estado"
          options={ESTADO_OPTIONS}
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        />
        <Select
          id="admin-pubs-moderacion"
          label="Moderacion"
          options={MODERACION_OPTIONS}
          value={moderacion}
          onChange={(e) => setModeracion(e.target.value)}
        />
        <div className="sm:col-span-3 sm:-mt-1">
          <Button type="submit" variant="ghost" className="w-auto">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Aplicar filtros
          </Button>
        </div>
      </form>

      {actionError ? <Alert type="error">{actionError}</Alert> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : result && result.data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {result.data.map((publication) => (
            <PublicationCard
              key={publication.id}
              publication={publication}
              withdrawing={withdrawing === publication.id}
              onWithdraw={() => handleWithdraw(publication)}
            />
          ))}
          <PaginationControls pagination={result.pagination} onChangePage={setPage} />
        </div>
      ) : (
        <Alert type="info">No hay publicaciones que coincidan con los filtros.</Alert>
      )}
    </section>
  );
}

interface PublicationCardProps {
  publication: AdminPublication;
  withdrawing: boolean;
  onWithdraw: () => void;
}

function PublicationCard({ publication, withdrawing, onWithdraw }: PublicationCardProps) {
  const retirada = publication.estadoModeracion === 'RETIRADA';

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-brand-poli md:flex-row md:items-start md:justify-between md:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={LABEL_ESTADO_MODERACION[publication.estadoModeracion]}
            tone={TONE_BY_ESTADO_MODERACION[publication.estadoModeracion]}
          />
          <StatusBadge label={LABEL_ESTADO_SOLICITUD[publication.estado]} />
        </div>
        <h2 className="text-base font-semibold text-text-main">{publication.tema}</h2>
        <p className="text-sm text-text-muted">{publication.materia.label}</p>
        {publication.descripcion ? (
          <p className="mt-1 line-clamp-2 text-sm text-text-main">{publication.descripcion}</p>
        ) : null}
        <p className="mt-1 text-xs text-text-muted">
          {publication.estudiante.fullName} &middot; {formatFecha(publication.createdAt)}
        </p>
      </div>

      <div className="md:justify-end">
        {retirada ? (
          <p className="text-xs font-semibold text-error">Retirada por moderacion</p>
        ) : (
          <button
            type="button"
            onClick={onWithdraw}
            disabled={publication.estado !== 'PUBLICADA' || withdrawing}
            title={
              publication.estado !== 'PUBLICADA'
                ? 'Solo se pueden retirar publicaciones abiertas'
                : undefined
            }
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-error px-3 py-2 text-xs font-semibold text-error transition-colors duration-200 hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50"
          >
            {withdrawing ? <Spinner size="sm" /> : <FolderX className="h-3.5 w-3.5" aria-hidden="true" />}
            Retirar publicacion
          </button>
        )}
      </div>
    </article>
  );
}
