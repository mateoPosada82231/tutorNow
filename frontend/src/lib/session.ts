'use client';

import { useAuthStore } from '@/stores/useAuthStore';

export function endSession() {
  useAuthStore.getState().logout();
}

export function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;
  window.location.replace('/login');
}
