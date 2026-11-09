'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { ReportModal } from './ReportModal';
import type { ReportTargetType } from '../types';

const LABELS: Record<ReportTargetType, string> = {
  PUBLICACION: 'Reportar',
  RESENA: 'Reportar resena',
  USUARIO: 'Reportar usuario',
};

interface ReportButtonProps {
  tipo: ReportTargetType;
  targetId: number;
  className?: string;
  label?: string;
}

export function ReportButton({ tipo, targetId, className = '', label }: ReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label ?? `${LABELS[tipo]}${tipo === 'USUARIO' ? '' : ' ' + targetId}`}
        title={LABELS[tipo]}
        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-text-muted transition-colors duration-200 hover:bg-error/10 hover:text-error focus:outline-none focus:ring-2 focus:ring-brand-poli ${className}`}
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        {label ? <span>{label}</span> : null}
      </button>
      <ReportModal tipo={tipo} targetId={targetId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
