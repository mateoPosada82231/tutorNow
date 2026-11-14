'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmationStatus } from '@/features/auth/components/ConfirmationStatus';
import { confirmPasswordChange } from '@/features/auth/api/authApi';

function ConfirmPasswordChangeContent() {
  const searchParams = useSearchParams();
  return (
    <ConfirmationStatus
      token={searchParams.get('token')}
      action={confirmPasswordChange}
      title="Cambio de contrasena"
      successMessage="Tu contrasena fue actualizada correctamente."
    />
  );
}

export default function ConfirmPasswordChangePage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPasswordChangeContent />
    </Suspense>
  );
}
