'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileWarning, RefreshCw, Star } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { listAdminReviews, withdrawReview } from '@/features/admin/api/adminApi';
import {
  LABEL_ESTADO_MODERACION,
  PaginationControls,
  StatusBadge,
  TONE_BY_ESTADO_MODERACION,
  formatFecha,
} from '@/features/admin/components';
import type { AdminReview, PageResponse } from '@/features/admin/types';

const MODERACION_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'VISIBLE', label: 'Visibles' },
  { value: 'RETIRADA', label: 'Retiradas' },
];

export default function AdminReviewsPage() {
  const [page, setPage] = useState(0);
  const [moderacion, setModeracion] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ moderacion: '', q: '' });
  const [q, setQ] = useState('');
  const [result, setResult] = useState<PageResponse<AdminReview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      setResult(
        await listAdminReviews({
          moderacion: appliedFilters.moderacion || undefined,
          q: appliedFilters.q || undefined,
          page,
          size: 10,
        }),
      );
    } catch {
      setActionError('No pudimos cargar las resenas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleWithdraw(review: AdminReview) {
    setActionError(null);
    setWithdrawing(review.id);
    try {
      await withdrawReview(review.id);
      await load();
    } catch (err) {
      setActionError(
        err instanceof Error && err.message ? err.message : 'No pudimos retirar la resena.',
      );
    } finally {
      setWithdrawing(null);
    }
  }

  function submitFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setAppliedFilters({ moderacion, q: q.trim() });
  }

  return (
    <section aria-label="Moderacion de resenas" className="flex flex-col gap-4">
      <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          id="admin-reviews-q"
          label="Buscar comentario"
          type="search"
          placeholder="Texto de la resena"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          id="admin-reviews-moderacion"
          label="Moderacion"
          options={MODERACION_OPTIONS}
          value={moderacion}
          onChange={(e) => setModeracion(e.target.value)}
        />
        <div className="sm:col-span-2 sm:-mt-1">
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
          {result.data.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              withdrawing={withdrawing === review.id}
              onWithdraw={() => handleWithdraw(review)}
            />
          ))}
          <PaginationControls pagination={result.pagination} onChangePage={setPage} />
        </div>
      ) : (
        <Alert type="info">No hay resenas que coincidan con los filtros.</Alert>
      )}
    </section>
  );
}

interface ReviewCardProps {
  review: AdminReview;
  withdrawing: boolean;
  onWithdraw: () => void;
}

function ReviewCard({ review, withdrawing, onWithdraw }: ReviewCardProps) {
  const retirada = review.estadoModeracion === 'RETIRADA';

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border-color bg-bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-brand-poli md:flex-row md:items-start md:justify-between md:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={LABEL_ESTADO_MODERACION[review.estadoModeracion]}
            tone={TONE_BY_ESTADO_MODERACION[review.estadoModeracion]}
          />
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-text-main">
            <Star
              className={`h-4 w-4 ${review.rating <= 2 ? 'text-error' : 'text-brand-accent'}`}
              fill="currentColor"
              aria-hidden="true"
            />
            {review.rating}/5
          </span>
          <StatusBadge label={review.rolAutor === 'ESTUDIANTE' ? 'Evaluando tutor' : 'Evaluando estudiante'} />
        </div>
        <p className="mt-1 text-sm text-text-main">&ldquo;{review.comentario}&rdquo;</p>
        <p className="mt-1 text-xs text-text-muted">
          {review.autor.fullName} &middot; Asesoria #{review.asesoriaId} &middot;{' '}
          {formatFecha(review.createdAt)}
        </p>
      </div>

      <div className="md:justify-end">
        {retirada ? (
          <p className="text-xs font-semibold text-error">Retirada por moderacion</p>
        ) : (
          <button
            type="button"
            onClick={onWithdraw}
            disabled={withdrawing}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-error px-3 py-2 text-xs font-semibold text-error transition-colors duration-200 hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-brand-poli disabled:cursor-not-allowed disabled:opacity-50"
          >
            {withdrawing ? <Spinner size="sm" /> : <FileWarning className="h-3.5 w-3.5" aria-hidden="true" />}
            Retirar resena
          </button>
        )}
      </div>
    </article>
  );
}
