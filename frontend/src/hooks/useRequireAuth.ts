'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import('@/stores/useAuthStore').then(({ useAuthStore }) => {
      const { token } = useAuthStore.getState();
      if (!token) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  return ready;
}
