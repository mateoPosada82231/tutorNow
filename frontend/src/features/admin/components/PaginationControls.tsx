'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationInfo } from '../types';

interface PaginationControlsProps {
  pagination: PaginationInfo;
  onChangePage: (page: number) => void;
}

export function PaginationControls({ pagination, onChangePage }: PaginationControlsProps) {
  const { page, totalPages, totalElements } = pagination;

  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <span className="text-sm text-text-muted">
        {totalElements} resultado{totalElements === 1 ? '' : 's'} &middot; Pagina {page + 1} de{' '}
        {Math.max(totalPages, 1)}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Pagina anterior"
          disabled={page === 0}
          onClick={() => onChangePage(page - 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border-color text-text-muted transition-colors duration-200 hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Pagina siguiente"
          disabled={page + 1 >= totalPages}
          onClick={() => onChangePage(page + 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border-color text-text-muted transition-colors duration-200 hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
