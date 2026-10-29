'use client';

import { useEffect, useState } from 'react';
import { Spinner } from './Spinner';

const FADE_MS = 150;

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
}

export function LoadingOverlay({ visible, label = 'Cargando...' }: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const timeout = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(timeout);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex cursor-wait items-center justify-center bg-[var(--overlay-bg)] px-4 backdrop-blur-sm transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="animate-[loading-overlay-in_180ms_ease-out] flex flex-col items-center gap-3 rounded-2xl border border-border-color bg-bg-surface px-8 py-6 shadow-2xl">
        <Spinner size="md" />
        <p className="text-sm font-medium text-text-muted">{label}</p>
      </div>
    </div>
  );
}
