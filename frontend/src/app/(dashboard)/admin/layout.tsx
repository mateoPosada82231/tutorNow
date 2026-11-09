'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { useAuthStore } from '@/stores/useAuthStore';
import { AdminSubNav } from '@/features/admin/components/AdminSubNav';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const [enforced, setEnforced] = useState(false);

  useEffect(() => {
    if (role === 'ADMIN' || role === undefined) return;
    router.replace('/dashboard');
  }, [role, router]);

  useEffect(() => {
    const timer = setTimeout(() => setEnforced(true), 400);
    return () => clearTimeout(timer);
  }, []);

  if (role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16">
        {enforced ? (
          <>
            <ShieldAlert className="h-10 w-10 text-error" aria-hidden="true" />
            <Alert type="error">No tienes acceso al panel de administracion.</Alert>
          </>
        ) : (
          <Spinner />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Panel de administracion</h1>
          <p className="text-sm text-text-muted">
            Gestiona usuarios, moderacion de contenido y reportes de la comunidad
          </p>
        </div>
        <AdminSubNav />
      </div>
      {children}
    </div>
  );
}
