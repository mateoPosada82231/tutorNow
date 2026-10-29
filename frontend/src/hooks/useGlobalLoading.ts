'use client';

import { useEffect, useState } from 'react';
import { isGlobalLoading, subscribeToGlobalLoading } from '@/lib/globalLoading';

export function useGlobalLoading(): boolean {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(isGlobalLoading());
    return subscribeToGlobalLoading(setBusy);
  }, []);

  return busy;
}
