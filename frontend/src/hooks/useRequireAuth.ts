'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      const { useAuthStore } = await import('@/stores/useAuthStore');
      const { token } = useAuthStore.getState();

      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const { fetchMyProfile } = await import('@/features/profile/api/profileApi');
        const profile = await fetchMyProfile();

        if (cancelled) return;

        useAuthStore.getState().updateUser({
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role,
        });
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        const { HttpError } = await import('@/lib/httpClient');
        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          useAuthStore.getState().logout();
        }
        router.replace('/login');
      }
    }

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return ready;
}
